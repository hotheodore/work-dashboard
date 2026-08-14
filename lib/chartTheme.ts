"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { SERIES } from "./classColors";

// The palette and the id→slot hash live in lib/classColors.ts (no "use client")
// so server components can use them too. Re-exported here because every chart
// already imports them from this module.
export { SERIES, colorFor, classHue, classVar } from "./classColors";

export interface ChartTheme {
  dark: boolean;
  series: string[];
  /** The live site accent (navy), read from --accent — not series[0],
   *  which is a class color and stays independent of the brand color. Used
   *  for accent-tinted surfaces like the activity heatmap. */
  accent: string;
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
  accent: "#14427e",
  grid: "#ece9e1",
  axis: "#8a8478",
  muted: "#d8d3c8",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e3e0d8",
  text: "#1f1e1c",
};

const DARK: ChartTheme = {
  dark: true,
  series: SERIES.dark,
  accent: "#5ea3d4",
  grid: "#30302e",
  axis: "#9b968c",
  muted: "#4a4844",
  tooltipBg: "#262625",
  tooltipBorder: "#3d3c39",
  text: "#f0eee7",
};

function compute(): ChartTheme {
  if (typeof document === "undefined") return LIGHT;
  const attr = document.documentElement.dataset.theme;
  const dark =
    attr === "dark" ||
    (!attr && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const base = dark ? DARK : LIGHT;
  // Read the live CSS custom property rather than trust the hardcoded
  // fallback above, so a future --accent edit in globals.css needs no
  // matching edit here.
  const live = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  return live ? { ...base, accent: live } : base;
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
    borderRadius: 12,
    boxShadow: "var(--shadow-lg)",
    color: t.text,
    fontSize: 12,
  };
}
