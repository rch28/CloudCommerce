import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  accent?: string;
}

export default function StatCard({ label, value, change, icon: Icon, accent = "#7C3AED" }: StatCardProps) {
  const up = change >= 0;
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-5 transition-all hover:-translate-y-0.5 hover:border-violet-700/50 hover:shadow-lg hover:shadow-primary/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-sm">
        <span className={`flex items-center gap-1 font-medium ${up ? "text-emerald-400" : "text-rose-400"}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change)}%
        </span>
        <span className="text-slate-500">vs last month</span>
      </div>
    </div>
  );
}
