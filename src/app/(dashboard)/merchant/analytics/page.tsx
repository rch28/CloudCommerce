"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { DollarSign, ShoppingCart, Users, TrendingUp, Target, FileText, Download, BarChart3 } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import MetricWidget from "@/components/dashboard/widgets/metric-widget";
import ChartWidget from "@/components/dashboard/widgets/chart-widget";
import BarChart from "@/components/dashboard/charts/bar-chart";
import AreaChart from "@/components/dashboard/charts/area-chart";
import TimeFilter, { type TimeRangeValue } from "@/components/dashboard/time-filter";
import { exportToCSV } from "@/lib/services/export";
import type { MerchantMetrics } from "@/lib/services/analytics";
import { analyticsApi } from "@/services/analytics.service";

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRangeValue>("month");
  const [start, setStart] = useState<string | undefined>();
  const [end, setEnd] = useState<string | undefined>();
  const [metrics, setMetrics] = useState<MerchantMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    const params: Record<string, string> = { range };
    if (start) params.start = start;
    if (end) params.end = end;
    const data = await analyticsApi.getMerchant(params);
    setMetrics(data);
  }, [range, start, end]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params: Record<string, string> = { range };
      if (start) params.start = start;
      if (end) params.end = end;
      const data = await analyticsApi.getMerchant(params);
      if (!cancelled) setMetrics(data);
    })().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, start, end]);

  const handleRangeChange = useCallback((newRange: TimeRangeValue, s?: string, e?: string) => {
    setRange(newRange);
    if (s !== undefined) setStart(s);
    if (e !== undefined) setEnd(e);
  }, []);

  const dollarFormat = useMemo(() => (v: number) => `$${(v / 1000).toFixed(0)}k`, []);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Track your store's performance metrics"
        actions={
          <div className="flex items-center gap-2">
            <TimeFilter value={range} onChange={handleRangeChange} />
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              <BarChart3 size={14} /> Refresh
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricWidget
            label="Revenue"
            value={`$${((metrics?.revenue ?? 84120) / 1000).toFixed(1)}k`}
            change={metrics?.revenueChange}
            icon={DollarSign}
            accent="#7C3AED"
            refreshInterval={30000}
            onRefresh={fetchMetrics}
          />
          <MetricWidget
            label="Orders"
            value={(metrics?.orders ?? 1510).toLocaleString()}
            change={metrics?.ordersChange}
            icon={ShoppingCart}
            accent="#06b6d4"
            refreshInterval={30000}
            onRefresh={fetchMetrics}
          />
          <MetricWidget
            label="Customers"
            value={(metrics?.customers ?? 86).toString()}
            change={metrics?.customersChange}
            icon={Users}
            accent="#22c55e"
          />
          <MetricWidget
            label="AOV"
            value={`$${(metrics?.aov ?? 55.70).toFixed(2)}`}
            change={metrics?.aovChange}
            icon={Target}
            accent="#f59e0b"
          />
          <MetricWidget
            label="Conversion"
            value={`${(metrics?.conversionRate ?? 3.2).toFixed(1)}%`}
            change={metrics?.conversionChange}
            icon={TrendingUp}
            accent="#ec4899"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartWidget
            title="Revenue Trend"
            description={range === "today" ? "Hourly revenue" : `${range}ly revenue`}
            refreshInterval={30000}
            onRefresh={fetchMetrics}
            className="lg:col-span-2"
          >
            <AreaChart data={metrics?.revenueData || []} accent="#7C3AED" formatter={dollarFormat} />
          </ChartWidget>

          <ChartWidget title="Orders" description="Daily order volume" refreshInterval={30000} onRefresh={fetchMetrics}>
            <BarChart data={metrics?.ordersData || []} accent="#06b6d4" />
          </ChartWidget>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#7C3AED]" />
              <h3 className="font-semibold text-foreground">Reports</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!metrics) return;
                  exportToCSV(
                    (metrics.revenueData || []).map((d) => ({ Period: d.label, Value: d.value })),
                    `revenue-report-${range}`
                  );
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              >
                <Download size={13} /> CSV
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { name: "Sales Report", desc: "Revenue, orders, items sold", href: `/api/v1/reports/sales?range=${range}&format=csv` },
              { name: "Inventory Report", desc: "Stock levels, low-stock alerts", href: "/api/v1/reports/inventory?format=csv" },
              { name: "Customer Report", desc: "Top spenders, order history", href: "/api/v1/reports/customers?format=csv" },
            ].map((r) => (
              <a
                key={r.name}
                href={r.href}
                className="rounded-lg border border-border p-4 transition-colors hover:border-[#7C3AED]/50 hover:bg-card"
              >
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#7C3AED]">
                  <Download size={11} /> Download CSV
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
