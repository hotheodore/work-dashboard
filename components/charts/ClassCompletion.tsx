"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/lib/chartTheme";
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
          contentStyle={{
            background: t.tooltipBg,
            border: `1px solid ${t.tooltipBorder}`,
            borderRadius: 8,
            color: t.text,
            fontSize: 12,
          }}
        />
        <Bar dataKey="done" name="Done" stackId="a" fill={t.series[4]} radius={[0, 0, 0, 0]} />
        <Bar dataKey="pending" name="Pending" stackId="a" fill={t.grid} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
