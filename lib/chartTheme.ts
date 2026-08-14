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
  grid: "#333331",
  axis: "#97948c",
  muted: "#4a4a46",
  tooltipBg: "#292927",
  tooltipBorder: "#403f3b",
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
    borderRadius: 12,
    boxShadow: "var(--shadow-lg)",
    color: t.text,
    fontSize: 12,
  };
}
