"use client";
import { useState } from "react";
import { Download, Search } from "lucide-react";
import Badge from "../Badge";
import { orders as allOrders } from "@/data/mock";

export default function OrdersView() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const statuses = ["all", "paid", "pending", "shipped", "delivered", "cancelled"];

  const filtered = allOrders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      (o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-all ${
                status === s
                  ? "bg-violet-600 text-white"
                  : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40">
                  <td className="px-5 py-4 font-medium text-violet-400">{o.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{o.customer}</p>
                    <p className="text-xs text-slate-500">{o.email}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{o.items}</td>
                  <td className="px-5 py-4 text-slate-400">{o.date}</td>
                  <td className="px-5 py-4"><Badge status={o.status} /></td>
                  <td className="px-5 py-4 text-right font-semibold text-white">${o.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
