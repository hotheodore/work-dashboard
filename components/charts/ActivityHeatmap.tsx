"use client";

import { useMemo, useState } from "react";
import { useChartTheme } from "@/lib/chartTheme";
import { streak } from "@/lib/grades";

const LEVELS = ["40", "73", "b3", "ff"];

function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** GitHub-style grid. Plain CSS grid — a chart library buys nothing here. */
export default function ActivityHeatmap({
  counts,
  weeks = 26,
  compact = false,
  showStats = false,
}: {
  counts: Record<string, number>; // YYYY-MM-DD -> activity count
  weeks?: number;
  compact?: boolean;
  /** Adds the streak / total / weekly-average summary beside the grid. */
  showStats?: boolean;
}) {
  const t = useChartTheme();
  const [hover, setHover] = useState<{ key: string; count: number; x: number; y: number } | null>(
    null,
  );

  const span = compact ? Math.min(weeks, 18) : weeks;

  const { days, months } = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + (6 - end.getDay())); // pad to end of current week
    const start = new Date(end);
    start.setDate(start.getDate() - (span * 7 - 1));

    const days: { key: string; count: number }[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = key(d);
      days.push({ key: k, count: counts[k] ?? 0 });
    }

    // One label per week column, emitted the first time a month appears.
    const months: { col: number; label: string }[] = [];
    let last = -1;
    for (let w = 0; w < span; w++) {
      const d = new Date(start);
      d.setDate(d.getDate() + w * 7);
      if (d.getMonth() !== last) {
        last = d.getMonth();
        months.push({ col: w, label: d.toLocaleDateString(undefined, { month: "short" }) });
      }
    }
    return { days, months };
  }, [counts, span]);

  const max = Math.max(1, ...days.map((d) => d.count));
  const shade = (n: number) =>
    n === 0 ? t.grid : t.series[0] + LEVELS[Math.ceil((n / max) * 4) - 1];

  const cell = compact ? "minmax(9px, 12px)" : "minmax(12px, 20px)";

  const grid = (
    <div className="relative min-w-0">
      <div className="flex gap-1.5">
        {!compact && (
          <div
            className="grid shrink-0 pt-[18px] text-[10px] leading-none text-faint"
            style={{ gridTemplateRows: "repeat(7, 1fr)", rowGap: 3 }}
          >
            {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
              <span key={i} className="flex items-center">
                {l}
              </span>
            ))}
          </div>
        )}

        <div className="min-w-0 overflow-x-auto">
          {!compact && (
            <div
              className="mb-1 grid text-[10px] leading-none text-faint"
              style={{ gridTemplateColumns: `repeat(${span}, ${cell})`, columnGap: 3 }}
            >
              {months.map((m) => (
                <span key={m.label + m.col} style={{ gridColumn: `${m.col + 1} / span 4` }}>
                  {m.label}
                </span>
              ))}
            </div>
          )}

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${span}, ${cell})`,
              gridTemplateRows: "repeat(7, auto)",
              gridAutoFlow: "column",
              gap: 3,
            }}
            onMouseLeave={() => setHover(null)}
          >
            {days.map((d) => (
              <div
                key={d.key}
                className="aspect-square rounded-[3px] transition-transform duration-100 hover:scale-125"
                style={{ background: shade(d.count) }}
                onMouseEnter={(e) => {
                  const box = e.currentTarget.offsetParent as HTMLElement | null;
                  const r = e.currentTarget.getBoundingClientRect();
                  const p = box?.getBoundingClientRect();
                  setHover({
                    key: d.key,
                    count: d.count,
                    x: r.left - (p?.left ?? 0) + r.width / 2,
                    y: r.top - (p?.top ?? 0),
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface px-2 py-1 text-[11px] whitespace-nowrap shadow-[var(--shadow)]"
          style={{ left: hover.x, top: hover.y - 6 }}
        >
          <span className="font-medium">
            {hover.count} {hover.count === 1 ? "action" : "actions"}
          </span>
          <span className="text-faint">
            {" · "}
            {new Date(`${hover.key}T00:00:00`).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-1 text-[10px] text-faint">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span
            key={l}
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: l === 0 ? t.grid : t.series[0] + LEVELS[l - 1],
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );

  if (!showStats) return grid;

  const total = days.reduce((s, d) => s + d.count, 0);
  const current = streak(Object.keys(counts));
  const perWeek = total / span;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
      {grid}
      <dl className="grid grid-cols-3 gap-6 border-border lg:ml-auto lg:shrink-0 lg:border-l lg:pl-10">
        {[
          { label: "Current streak", value: `${current}d` },
          { label: `Last ${span} weeks`, value: total },
          { label: "Weekly average", value: perWeek.toFixed(1) },
        ].map((s) => (
          <div key={s.label}>
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-faint">
              {s.label}
            </dt>
            <dd className="tabular mt-1.5 text-2xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
