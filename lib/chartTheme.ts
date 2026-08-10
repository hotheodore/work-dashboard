"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/** Stable series palette, colorblind-safe ordering, one variant per theme.
 *  [0] is the accent so accent-tinted charts (the heatmap) track the brand. */
export const SERIES = {
  light: ["#3b6ea8", "#0f7a8a", "#b4700f", "#a8467a", "#157f5a", "#6b5bb5", "#c0392b", "#2b7fb8"],
  dark: ["#6a9fd8", "#56c2c8", "#e0b25c", "#d98cb0", "#6ec9a0", "#a99cea", "#e88b7d", "#7cc0ea"],
};

export interface ChartTheme {
  dark: boolean;
  series: string[];
  grid: string;
  axis: string;
  /** For low-emphasis data (e.g. "pending"). Distinct from `grid` on purpose —
   *  sharing that color made pending bars invisible against the gridlines. */
  muted: string;
  tooltipBg: string;
  tooltipBorder: string;
  text: string;
}

const LIGHT: ChartTheme = {
  dark: false,
  series: SERIES.light,
  grid: "#eae7e1",
  axis: "#8b857a",
  muted: "#d6d1c8",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e5e1da",
  text: "#23211d",
};

const DARK: ChartTheme = {
  dark: true,
  series: SERIES.dark,
  grid: "#3d3d39",
  axis: "#948f85",
  muted: "#55554e",
  tooltipBg: "#30302e",
  tooltipBorder: "#45453f",
  text: "#ecebe8",
};

function compute(): ChartTheme {
  if (typeof document === "undefined") return LIGHT;
  const attr = document.documentElement.dataset.theme;
  const dark =
    attr === "dark" ||
    (!attr && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return dark ? DARK : LIGHT;
}

// The server renders light; syncing in a layout effect repaints before the
// browser paints, so charts no longer flash light on a dark-mode reload.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Re-renders charts when the theme flips, so nothing washes out on dark surfaces. */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(LIGHT);

  useIsomorphicLayoutEffect(() => {
    const update = () => setTheme(compute());
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", update);
      obs.disconnect();
    };
  }, []);

  return theme;
}

/** Shared Recharts <Tooltip contentStyle> — was duplicated in every chart. */
export function tooltipStyle(t: ChartTheme): React.CSSProperties {
  return {
    background: t.tooltipBg,
    border: `1px solid ${t.tooltipBorder}`,
    borderRadius: 10,
    color: t.text,
    fontSize: 12,
  };
}

/** Deterministic color for a class id so a class keeps its color everywhere. */
export function colorFor(id: string, series: string[]): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return series[h % series.length];
}
