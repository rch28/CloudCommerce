"use client";
import React from "react";
import { Package, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { accountApi } from "@/services/account.service";

const statusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10",
  confirmed: "text-sky-400 bg-sky-500/10",
  shipped: "text-blue-400 bg-blue-500/10",
  delivered: "text-emerald-400 bg-emerald-500/10",
  cancelled: "text-rose-400 bg-rose-500/10",
};

interface Order {
  id: string;
  number: string;
  status: string;
  total: number;
  items: number;
  date: string;
}

export default function AccountOrdersPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    accountApi.listOrders()
      .then((data: any) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#F8FAFC]">Order History</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="mb-2 h-4 w-1/3 rounded bg-[#18181B]" />
            <div className="mb-1 h-3 w-1/2 rounded bg-[#18181B]" />
            <div className="h-3 w-1/4 rounded bg-[#18181B]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#F8FAFC]">Order History</h2>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <Package size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders yet</p>
          <Button asChild className="mt-4">
            <Link href={`/store/${tenant}/products`}>
              Start Shopping
            </Link>
          </Button>
        </div>
      ) : (
        orders.map((order) => (
          <Link key={order.id} href={`/store/${tenant}/account/orders/${order.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-[#7C3AED]/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-[#F8FAFC]">#{order.number}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[order.status] || "text-muted-foreground bg-muted/10"}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{order.items} item{order.items > 1 ? "s" : ""} &middot; ${order.total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{order.date}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </Link>
        ))
      )}
    </div>
  );
}
