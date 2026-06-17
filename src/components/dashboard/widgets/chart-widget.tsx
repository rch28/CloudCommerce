"use client";
import { useState, useEffect, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface ChartWidgetProps {
  title: string;
  description?: string;
  children: ReactNode;
  refreshInterval?: number;
  onRefresh?: () => Promise<void>;
  action?: ReactNode;
  className?: string;
}

export default function ChartWidget({
  title, description, children, refreshInterval, onRefresh, action, className,
}: ChartWidgetProps) {
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;
    const interval = setInterval(async () => {
      setPolling(true);
      try { await onRefresh(); } finally { setPolling(false); }
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-semibold text-[#F8FAFC]">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {polling && <RefreshCw size={13} className="animate-spin text-[#7C3AED]" />}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}
