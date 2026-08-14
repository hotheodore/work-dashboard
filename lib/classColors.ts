/** Stable series palette, colorblind-safe ordering, one variant per theme.
 *  [0] is the accent so accent-tinted surfaces (the heatmap) track the brand.
 *  Kept in a directive-free module so server components can use it too —
 *  lib/chartTheme.ts is "use client" and re-exports from here. */
export const SERIES = {
  light: ["#5b52e0", "#0f7a8a", "#7b3fd4", "#a8467a", "#157f5a", "#c0392b", "#2b7fb8", "#8a6a3d"],
  dark: ["#a5a0ff", "#56c2c8", "#c98bff", "#d98cb0", "#6ec9a0", "#e88b7d", "#7cc0ea", "#cbab7a"],
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
