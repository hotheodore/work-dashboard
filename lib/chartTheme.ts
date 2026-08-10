"use client";

import { useEffect, useState } from "react";

/** Stable series palette, colorblind-safe ordering, one variant per theme. */
export const SERIES = {
  light: ["#4f46e5", "#0891b2", "#d97706", "#db2777", "#059669", "#7c3aed", "#dc2626", "#0284c7"],
  dark: ["#818cf8", "#22d3ee", "#fbbf24", "#f472b6", "#34d399", "#a78bfa", "#f87171", "#38bdf8"],
};

export interface ChartTheme {
  dark: boolean;
  series: string[];
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  text: string;
}

function compute(): ChartTheme {
  const dark =
    typeof document !== "undefined" &&
    (document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches));
  return {
    dark,
    series: dark ? SERIES.dark : SERIES.light,
    grid: dark ? "#1e293b" : "#e2e8f0",
    axis: dark ? "#64748b" : "#94a3b8",
    tooltipBg: dark ? "#0f172a" : "#ffffff",
    tooltipBorder: dark ? "#1e293b" : "#e2e8f0",
    text: dark ? "#e2e8f0" : "#0f172a",
  };
}

/** Re-renders charts when the theme flips, so nothing washes out on dark surfaces. */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(() => ({
    dark: false,
    series: SERIES.light,
    grid: "#e2e8f0",
    axis: "#94a3b8",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e2e8f0",
    text: "#0f172a",
  }));

  useEffect(() => {
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

/** Deterministic color for a class id so a class keeps its color everywhere. */
export function colorFor(id: string, series: string[]): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return series[h % series.length];
}
