"use client";
import { useState, useEffect } from "react";
import { Building2, Store, DollarSign, ShoppingCart, TrendingUp, CircleCheck, AlertCircle, UserPlus, CreditCard } from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "@/components/dashboard/stats-card";
import ChartCard from "@/components/dashboard/chart-card";
import ErrorState from "@/components/dashboard/error-state";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import Badge from "@/components/cc/Badge";
import { adminApi } from "@/services/admin.service";

interface Merchant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  orders: number;
  status: "active" | "trialing" | "past_due";
  revenue: number;
}

interface Activity {
  id: string;
  type: "merchant_joined" | "store_launched" | "payment_received" | "plan_upgraded" | "alert";
  message: string;
  time: string;
  user?: string;
}

interface AdminMetrics {
  totalMerchants: number;
  activeStores: number;
  platformRevenue: number;
  ordersToday: number;
  merchantChange: number;
  storeChange: number;
  revenueChange: number;
  ordersChange: number;
}

interface DashboardData {
  adminMetrics: AdminMetrics;
  merchants: Merchant[];
  activity: Activity[];
  revenueData: Array<{ month: string; revenue: number; orders: number }>;
  merchantGrowthData: Array<{ month: string; merchants: number; active: number }>;
}

export default function AdminDashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await adminApi.getStats();
        setData(d);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (error) {
    return     <ErrorState onRetry={async () => { setError(false); setLoading(true); try { const d = await adminApi.getStats(); setData(d); } catch { setError(true); } finally { setLoading(false); } }} />;
  }

  if (loading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  const { adminMetrics, merchants, activity, revenueData, merchantGrowthData } = data!;

  const activityIcon = (type: string) => {
    switch (type) {
      case "merchant_joined": return <UserPlus size={14} className="text-[#7C3AED]" />;
      case "store_launched": return <Store size={14} className="text-[#06b6d4]" />;
      case "payment_received": return <CreditCard size={14} className="text-emerald-400" />;
      case "plan_upgraded": return <TrendingUp size={14} className="text-[#22c55e]" />;
      case "alert": return <AlertCircle size={14} className="text-amber-400" />;
      default: return <CircleCheck size={14} className="text-[#7C3AED]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total Merchants"
          value={adminMetrics.totalMerchants.toLocaleString()}
          change={adminMetrics.merchantChange}
          icon={Building2}
          accent="#7C3AED"
        />
        <StatsCard
          label="Active Stores"
          value={adminMetrics.activeStores.toLocaleString()}
          change={adminMetrics.storeChange}
          icon={Store}
          accent="#06b6d4"
        />
        <StatsCard
          label="Platform Revenue"
          value={`$${(adminMetrics.platformRevenue / 1000).toFixed(0)}k`}
          change={adminMetrics.revenueChange}
          icon={DollarSign}
          accent="#22c55e"
        />
        <StatsCard
          label="Orders Today"
          value={adminMetrics.ordersToday.toLocaleString()}
          change={adminMetrics.ordersChange}
          icon={ShoppingCart}
          accent="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Platform Revenue" description="Monthly revenue" className="lg:col-span-2">
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="month" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#18181B", border: "1px solid #27272A", borderRadius: 8, color: "#F8FAFC" }}
                  cursor={{ fill: "#7C3AED11" }}
                />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No revenue data yet
            </div>
          )}
        </ChartCard>

        <ChartCard title="Merchant Growth" description="Active merchants">
          {merchantGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={merchantGrowthData}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="month" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#18181B", border: "1px solid #27272A", borderRadius: 8, color: "#F8FAFC" }}
                  cursor={{ stroke: "#27272A" }}
                />
                <Area type="monotone" dataKey="active" stroke="#7C3AED" strokeWidth={2.5} fill="url(#growthGrad)" name="Active" />
                <Area type="monotone" dataKey="merchants" stroke="#06b6d4" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Total" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No growth data yet
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 lg:col-span-3">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-semibold text-[#F8FAFC]">Recent Merchants</h3>
          </div>
          {merchants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Merchant</th>
                    <th className="px-5 py-3.5 font-medium">Domain</th>
                    <th className="px-5 py-3.5 font-medium">Plan</th>
                    <th className="px-5 py-3.5 font-medium">Orders</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {merchants.map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-[#1E293B]">
                      <td className="px-5 py-4 font-medium text-[#F8FAFC]">{m.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{m.subdomain}.cloudcommerce.com</td>
                      <td className="px-5 py-4 font-medium text-[#8B5CF6]">{m.plan}</td>
                      <td className="px-5 py-4 text-muted-foreground">{m.orders.toLocaleString()}</td>
                      <td className="px-5 py-4"><Badge status={m.status} /></td>
                      <td className="px-5 py-4 text-right font-semibold text-[#F8FAFC]">${m.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No merchants yet
            </div>
          )}
        </div>

        <ChartCard title="Recent Activity" className="lg:col-span-2">
          {activity.length > 0 ? (
            <div className="space-y-0">
              {activity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 border-b border-border/40 py-3 last:border-0"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E293B]">
                    {activityIcon(a.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#F8FAFC]">
                      {a.message}{a.user ? ` — ` : ""}
                      {a.user && <span className="font-medium text-[#8B5CF6]">{a.user}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No recent activity
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
