"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/lib/chartTheme";
import { EmptyState } from "@/components/ui";

export default function AppFunnel({
  data,
  compact = false,
}: {
  data: { stage: string; count: number }[];
  compact?: boolean;
}) {
  const t = useChartTheme();
  if (!data.some((d) => d.count > 0))
    return <EmptyState title="No applications yet" hint="Apply to a pick to start the funnel." />;

  return (
    <ResponsiveContainer width="100%" height={compact ? 160 : 280}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="stage"
          width={72}
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
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={d.stage} fill={t.series[i % t.series.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
