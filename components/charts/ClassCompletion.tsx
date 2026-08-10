"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { tooltipStyle, useChartTheme } from "@/lib/chartTheme";
import { EmptyState } from "@/components/ui";

export default function ClassCompletion({
  data,
  compact = false,
}: {
  data: { name: string; done: number; pending: number }[];
  compact?: boolean;
}) {
  const t = useChartTheme();
  if (!data.length) return <EmptyState title="No classes yet" hint="Add a class to see progress." />;

  return (
    <ResponsiveContainer width="100%" height={compact ? 160 : 280}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={t.grid} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={compact ? 70 : 110}
          tick={{ fill: t.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: t.grid, opacity: 0.4 }}
          contentStyle={tooltipStyle(t)}
        />
        <Bar dataKey="done" name="Done" stackId="a" fill={t.series[4]} radius={[0, 0, 0, 0]} />
        {/* t.muted, not t.grid — sharing the gridline color made this bar vanish. */}
        <Bar dataKey="pending" name="Pending" stackId="a" fill={t.muted} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
