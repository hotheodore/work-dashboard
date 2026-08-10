"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colorFor, tooltipStyle, useChartTheme } from "@/lib/chartTheme";
import { EmptyState } from "@/components/ui";
import type { TimelinePoint } from "@/lib/derive";

export default function DueTimeline({
  data,
  classes,
  compact = false,
}: {
  data: TimelinePoint[];
  classes: { id: string; name: string }[];
  compact?: boolean;
}) {
  const t = useChartTheme();
  const hasWork = data.some((d) =>
    classes.some((c) => typeof d[c.id] === "number" && (d[c.id] as number) > 0),
  );
  if (!hasWork) return <EmptyState title="Nothing due in the next 14 days" />;

  return (
    <ResponsiveContainer width="100%" height={compact ? 160 : 280}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: t.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={compact ? 2 : 0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: t.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: t.grid, opacity: 0.4 }}
          contentStyle={tooltipStyle(t)}
        />
        {classes.map((c) => (
          <Bar
            key={c.id}
            dataKey={c.id}
            name={c.name}
            stackId="due"
            fill={colorFor(c.id, t.series)}
            radius={[3, 3, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
