"use client";
import { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, Package, Boxes, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "@/components/dashboard/stats-card";
import ChartCard from "@/components/dashboard/chart-card";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import ErrorState from "@/components/dashboard/error-state";
import LiveOrdersFeed from "@/components/dashboard/merchant/live-orders-feed";

interface DashboardStats {
  revenue: number;
  orders: number;
  products: number;
  inventory: number;
  revenueChange: number;
  ordersChange: number;
  productsChange: number;
  inventoryChange: number;
  revenueData: Array<{ month: string; revenue: number; orders: number }>;
  orderChartData: Array<{ day: string; orders: number }>;
}

export default function MerchantDashboardView() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/v1/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LoadingSkeleton variant="chart" />
          </div>
          <LoadingSkeleton variant="chart" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState onRetry={fetchStats} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total Revenue"
          value={`$${(data.revenue / 1000).toFixed(1)}k`}
          change={data.revenueChange}
          icon={DollarSign}
          accent="#7C3AED"
        />
        <StatsCard
          label="Orders"
          value={data.orders.toLocaleString()}
          change={data.ordersChange}
          icon={ShoppingCart}
          accent="#06b6d4"
        />
        <StatsCard
          label="Products"
          value={data.products.toString()}
          change={data.productsChange}
          icon={Package}
          accent="#22c55e"
        />
        <StatsCard
          label="Inventory Items"
          value={data.inventory.toString()}
          change={data.inventoryChange}
          icon={Boxes}
          accent="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          title="Revenue Overview"
          description="Monthly performance"
          className="lg:col-span-2"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <Activity size={13} /> Live
            </span>
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.revenueData}>
              <defs>
                <linearGradient id="merchantRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="month" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#A1A1AA" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }}
                cursor={{ stroke: "#27272A" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#merchantRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders This Week" description="Daily order volume">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.orderChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis dataKey="day" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }}
                cursor={{ fill: "#7C3AED11" }}
              />
              <Bar dataKey="orders" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <LiveOrdersFeed />
    </div>
  );
}
