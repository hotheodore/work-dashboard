/** Stable series palette, colorblind-safe ordering, one variant per theme.
 *  Independent of --accent on purpose: the heatmap reads the live --accent,
 *  and class identity should survive a rebrand without eight classes changing
 *  color. Warm-biased to sit against the cool accents.
 *  Kept in a directive-free module so server components can use it too —
 *  lib/chartTheme.ts is "use client" and re-exports from here. */
export const SERIES = {
  light: ["#9c4526", "#17655a", "#853d5e", "#8e5214", "#426627", "#5a4285", "#3d598e", "#664a33"],
  dark: ["#d9805c", "#4bb09c", "#d07f9c", "#d19a4d", "#86b85c", "#a189d6", "#7c9bcc", "#b28e70"],
};

/** Deterministic 0–7 slot for a class id, stable across themes and renders.
 *  Pairs with the --class-0..7 custom properties in globals.css, which is how
 *  server components get a class color without knowing the active theme. */
export function classHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % SERIES.light.length;
}

/** Deterministic color for a class id so a class keeps its color everywhere. */
export function colorFor(id: string, series: string[]): string {
  return series[classHue(id) % series.length];
}

/** Inline style that sets --class-color for anything using .card-spine or a
 *  border-l that reads it. Server-safe: resolves per theme in CSS, not JS. */
export function classVar(id: string): React.CSSProperties {
  return { ["--class-color" as string]: `var(--class-${classHue(id)})` };
}
