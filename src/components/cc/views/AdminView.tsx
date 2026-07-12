"use client";
import { Building2, DollarSign, TrendingUp, Globe } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "@/components/dashboard/stats-card";
import Badge from "../Badge";
import { merchants } from "@/data/mock";

const planColor: Record<string, string> = {
  Starter: "text-muted-foreground",
  Growth: "text-cyan-400",
  Scale: "text-violet-400",
};

export default function AdminView() {
  const chartData = merchants.map((m) => ({ name: m.name.split(" ")[0], revenue: m.revenue }));
  const totalRev = merchants.reduce((s, m) => s + m.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Merchants" value="214" change={8.4} icon={Building2} accent="#7C3AED" />
        <StatCard label="Platform Revenue" value={`$${(totalRev / 1000).toFixed(0)}k`} change={21.5} icon={DollarSign} accent="#06b6d4" />
        <StatCard label="MRR Growth" value="$48.2k" change={14.7} icon={TrendingUp} accent="#22c55e" />
        <StatCard label="Custom Domains" value="87" change={6.2} icon={Globe} accent="#f59e0b" />
      </div>

      <div className="rounded-xl border border-border bg-muted/50 p-5">
        <h3 className="mb-4 font-semibold text-white">Revenue by Merchant</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip
              cursor={{ fill: "#7C3AED11" }}
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
            />
            <Bar dataKey="revenue" fill="#7C3AED" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-muted/50">
        <h3 className="border-b border-border px-5 py-4 font-semibold text-white">All Merchants</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Merchant</th>
                <th className="px-5 py-3.5">Domain</th>
                <th className="px-5 py-3.5">Plan</th>
                <th className="px-5 py-3.5">Orders</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {merchants.map((m) => (
                <tr key={m.id} className="hover:bg-accent/40">
                  <td className="px-5 py-4 font-medium text-white">{m.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{m.subdomain}.cloudcommerce.com</td>
                  <td className={`px-5 py-4 font-medium ${planColor[m.plan]}`}>{m.plan}</td>
                  <td className="px-5 py-4 text-muted-foreground">{m.orders.toLocaleString()}</td>
                  <td className="px-5 py-4"><Badge status={m.status} /></td>
                  <td className="px-5 py-4 text-right font-semibold text-white">${m.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
