"use client";
import { DollarSign, ShoppingCart, Package, Users, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "@/components/dashboard/stats-card";
import Badge from "../Badge";
import { revenueData, categoryData, orders } from "@/data/mock";

export default function DashboardView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value="$84,120" change={16.2} icon={DollarSign} accent="#7C3AED" />
        <StatCard label="Orders" value="1,510" change={12.8} icon={ShoppingCart} accent="#06b6d4" />
        <StatCard label="Products" value="142" change={4.1} icon={Package} accent="#22c55e" />
        <StatCard label="Customers" value="3,284" change={-2.3} icon={Users} accent="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/50 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Revenue Overview</h3>
              <p className="text-sm text-muted-foreground">Monthly performance</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <Activity size={13} /> Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-muted/50 p-5">
          <h3 className="font-semibold text-white">Sales by Category</h3>
          <p className="text-sm text-muted-foreground">Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {categoryData.map((c) => (
                  <Cell key={c.name} fill={c.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="font-medium text-white">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/50 p-5">
        <h3 className="mb-4 font-semibold text-white">Recent Orders</h3>
        <div className="space-y-2">
          {orders.slice(0, 5).map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 hover:border-border hover:bg-accent/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">
                  {o.customer.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{o.customer}</p>
                  <p className="text-xs text-slate-500">{o.id} · {o.items} items</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge status={o.status} />
                <span className="text-sm font-semibold text-white">${o.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
