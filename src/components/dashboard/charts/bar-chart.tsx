"use client";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  accent?: string;
  height?: number;
  formatter?: (v: number) => string;
  barSize?: number;
}

export default function BarChart({ data, accent = "#7C3AED", height = 260, formatter, barSize = 32 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBar data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
        <XAxis dataKey="label" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#A1A1AA" fontSize={12} tickFormatter={(v: any) => formatter ? formatter(Number(v)) : v} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }}
          cursor={{ fill: `${accent}11` }}
          formatter={(value: any) => [formatter ? formatter(Number(value)) : value, ""]}
        />
        <Bar dataKey="value" fill={accent} radius={[6, 6, 0, 0]} barSize={barSize} />
      </RechartsBar>
    </ResponsiveContainer>
  );
}
