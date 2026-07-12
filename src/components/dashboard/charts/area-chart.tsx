"use client";
import {
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AreaChartProps {
  data: Array<{ label: string; value: number }>;
  accent?: string;
  height?: number;
  formatter?: (v: number) => string;
}

export default function AreaChart({ data, accent = "#7C3AED", height = 260, formatter }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsArea data={data}>
        <defs>
          <linearGradient id={`grad-${accent.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accent} stopOpacity={0.4} />
            <stop offset="95%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
        <XAxis dataKey="label" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#A1A1AA" fontSize={12} tickFormatter={(v: any) => formatter ? formatter(Number(v)) : v} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }}
          cursor={{ stroke: "#27272A" }}
          formatter={(value: any) => [formatter ? formatter(Number(value)) : value, ""]}
        />
        <Area type="monotone" dataKey="value" stroke={accent} strokeWidth={2.5} fill={`url(#grad-${accent.replace("#", "")})`} />
      </RechartsArea>
    </ResponsiveContainer>
  );
}
