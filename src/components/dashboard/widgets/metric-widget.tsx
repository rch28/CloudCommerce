"use client";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricWidgetProps {
  label: string;
  value: string;
  change?: number;
  icon?: LucideIcon;
  accent?: string;
  detail?: ReactNode;
  refreshInterval?: number;
  onRefresh?: () => Promise<void>;
}

export default function MetricWidget({
  label, value, change, icon: Icon, accent = "#7C3AED",
  detail, refreshInterval, onRefresh,
}: MetricWidgetProps) {
  const [polling, setPolling] = useState(false);

  const refresh = useCallback(async () => {
    if (!onRefresh) return;
    setPolling(true);
    try { await onRefresh(); } finally { setPolling(false); }
  }, [onRefresh]);

  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh, refresh]);

  const up = change !== undefined ? change >= 0 : true;

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7C3AED]/50 hover:shadow-lg hover:shadow-[#7C3AED]/10">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {polling && <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-pulse" />}
          </div>
          <p className="text-2xl font-bold tracking-tight text-[#F8FAFC]">{value}</p>
        </div>
        {Icon && (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors group-hover:scale-110"
            style={{ backgroundColor: `${accent}20`, color: accent }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          <span className={`flex items-center gap-1 font-medium ${up ? "text-emerald-400" : "text-rose-400"}`}>
            {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground/60">vs previous period</span>
        </div>
      )}
      {detail && <div className="mt-3">{detail}</div>}
    </div>
  );
}
