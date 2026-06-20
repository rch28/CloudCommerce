import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  accent?: string;
}

export default function StatsCard({ label, value, change, icon: Icon, accent = "#7C3AED" }: StatsCardProps) {
  const up = change >= 0;
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7C3AED]/50 hover:shadow-lg hover:shadow-[#7C3AED]/10">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-[#F8FAFC]">{value}</p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors group-hover:scale-110"
          style={{ backgroundColor: `${accent}20`, color: accent }}
        >
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-sm">
        <span className={`flex items-center gap-1 font-medium ${up ? "text-emerald-400" : "text-rose-400"}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change)}%
        </span>
        <span className="text-muted-foreground/60">vs last month</span>
      </div>
    </div>
  );
}
