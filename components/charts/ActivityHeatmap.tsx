"use client";

import { useChartTheme } from "@/lib/chartTheme";

/** GitHub-style grid. Plain CSS grid — a chart library buys nothing here. */
export default function ActivityHeatmap({
  counts,
  weeks = 26,
  compact = false,
}: {
  counts: Record<string, number>; // YYYY-MM-DD -> activity count
  weeks?: number;
  compact?: boolean;
}) {
  const t = useChartTheme();
  const span = compact ? Math.min(weeks, 18) : weeks;
  const cell = compact ? 9 : 12;

  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay())); // pad to end of current week
  const days: { key: string; count: number }[] = [];
  const start = new Date(end);
  start.setDate(start.getDate() - (span * 7 - 1));
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ key, count: counts[key] ?? 0 });
  }

  const max = Math.max(1, ...days.map((d) => d.count));
  const shade = (n: number) => {
    if (n === 0) return t.grid;
    const level = Math.ceil((n / max) * 4); // 1..4
    return t.series[0] + ["40", "73", "b3", "ff"][level - 1];
  };

  return (
    <div className="overflow-x-auto">
      <div
        className="grid grid-flow-col gap-[3px]"
        style={{ gridTemplateRows: `repeat(7, ${cell}px)`, width: "max-content" }}
      >
        {days.map((d) => (
          <div
            key={d.key}
            title={`${d.key}: ${d.count} ${d.count === 1 ? "action" : "actions"}`}
            style={{ width: cell, height: cell, background: shade(d.count), borderRadius: 3 }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-faint">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span
            key={l}
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: l === 0 ? t.grid : t.series[0] + ["40", "73", "b3", "ff"][l - 1],
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
