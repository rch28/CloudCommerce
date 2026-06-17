"use client";
import React from "react";
import { Package, ChevronRight } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10",
  confirmed: "text-sky-400 bg-sky-500/10",
  shipped: "text-blue-400 bg-blue-500/10",
  delivered: "text-emerald-400 bg-emerald-500/10",
  cancelled: "text-rose-400 bg-rose-500/10",
};

export default function AccountOrdersPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const base = `/store/${tenant}/account`;

  const demoOrders = [
    { id: "1", number: "DEMO-10001", status: "delivered", total: 89.97, items: 3, date: "2026-06-10" },
    { id: "2", number: "DEMO-10002", status: "shipped", total: 149.50, items: 2, date: "2026-06-14" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#F8FAFC]">Order History</h2>
      {demoOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <Package size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders yet</p>
          <Link href={`/store/${tenant}/products`} className="mt-4 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        demoOrders.map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-[#F8FAFC]">#{order.number}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[order.status] || "text-muted-foreground"}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{order.items} item{order.items > 1 ? "s" : ""} &middot; ${order.total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{order.date}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </div>
        ))
      )}
    </div>
  );
}
