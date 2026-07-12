"use client";
import React from "react";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountApi } from "@/services/account.service";

const statusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10",
  confirmed: "text-sky-400 bg-sky-500/10",
  shipped: "text-blue-400 bg-blue-500/10",
  delivered: "text-emerald-400 bg-emerald-500/10",
  cancelled: "text-rose-400 bg-rose-500/10",
};

interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Address {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface OrderData {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
  address?: Address;
}

export default function AccountOrderDetailPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = React.use(params);
  const router = useRouter();
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const base = `/store/${tenant}/account/orders`;

  React.useEffect(() => {
    (async () => {
      try {
        const data = await accountApi.getOrder(id);
        setOrder(data.order || null);
      } catch {
        router.replace(`/store/${tenant}/account/orders`);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, tenant, router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-6 h-4 w-24 animate-pulse rounded bg-muted/70" />
        <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-muted/70" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted/70" />
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
              <div className="mb-2 h-4 w-2/3 rounded bg-muted/70" />
              <div className="h-3 w-1/3 rounded bg-muted/70" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground font-mono">#{order.number}</h2>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[order.status] || "text-muted-foreground bg-muted/10"}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Items ({order.items.length})</h3>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted/70">
                {item.image ? (
                  <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Package size={18} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-foreground">${item.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : `$${order.shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>${order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-foreground">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.address && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Shipping Address</h3>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">{order.address.label}</p>
            <p>{order.address.line1}</p>
            {order.address.line2 && <p>{order.address.line2}</p>}
            <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
            <p>{order.address.country}</p>
          </div>
        </div>
      )}

      {order.notes && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">Notes</h3>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
