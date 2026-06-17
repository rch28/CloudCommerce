"use client";
import { useState } from "react";
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
import ErrorState from "@/components/dashboard/error-state";
import Badge from "@/components/cc/Badge";
import { revenueData, orderChartData, orders, merchantMetrics } from "@/data/mock";

export default function MerchantDashboardView() {
  const [error, setError] = useState(false);

  if (error) {
    return <ErrorState onRetry={() => setError(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total Revenue"
          value={`$${(merchantMetrics.revenue / 1000).toFixed(1)}k`}
          change={merchantMetrics.revenueChange}
          icon={DollarSign}
          accent="#7C3AED"
        />
        <StatsCard
          label="Orders"
          value={merchantMetrics.orders.toLocaleString()}
          change={merchantMetrics.ordersChange}
          icon={ShoppingCart}
          accent="#06b6d4"
        />
        <StatsCard
          label="Products"
          value={merchantMetrics.products.toString()}
          change={merchantMetrics.productsChange}
          icon={Package}
          accent="#22c55e"
        />
        <StatsCard
          label="Inventory Items"
          value={merchantMetrics.inventory.toString()}
          change={merchantMetrics.inventoryChange}
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
            <AreaChart data={revenueData}>
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
                contentStyle={{ background: "#18181B", border: "1px solid #27272A", borderRadius: 8, color: "#F8FAFC" }}
                cursor={{ stroke: "#27272A" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#merchantRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders This Week" description="Daily order volume">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={orderChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis dataKey="day" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#18181B", border: "1px solid #27272A", borderRadius: 8, color: "#F8FAFC" }}
                cursor={{ fill: "#7C3AED11" }}
              />
              <Bar dataKey="orders" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Recent Orders">
        <div className="space-y-1">
          {orders.slice(0, 5).map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[#1E293B]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED]/15 text-xs font-bold text-[#8B5CF6]">
                  {o.customer.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F8FAFC]">{o.customer}</p>
                  <p className="text-xs text-muted-foreground">{o.id} · {o.items} items · {o.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge status={o.status} />
                <span className="text-sm font-semibold text-[#F8FAFC]">${o.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
