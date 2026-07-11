"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { storefrontApi } from "@/services/storefront.service";

interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface OrderAddress {
  label: string;
  line1: string;
  line2: string | null;
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
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  address: OrderAddress | null;
}

export default function CheckoutSuccessPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const base = `/store/${tenant}`;

  const pollOrder = useCallback(async () => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    try {
      const data = await storefrontApi.getStripeSessionStatus(sessionId);
      if (data.found && data.order) {
        setOrder(data.order);
        setLoading(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [sessionId]);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30;
    const interval = 1000;

    const poll = async () => {
      while (attempts < maxAttempts) {
        const found = await pollOrder();
        if (found) return;
        attempts++;
        await new Promise((r) => setTimeout(r, interval));
      }
      setError("Order confirmation is taking longer than expected. Please check your orders page.");
      setLoading(false);
    };

    poll();
  }, [pollOrder]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mb-6 flex justify-center">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <Skeleton className="mx-auto mb-3 h-7 w-56" />
        <Skeleton className="mx-auto h-4 w-72" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-4">Order Status</h1>
        <p className="text-muted-foreground mb-6">{error || "Order not found"}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="xl">
            <Link href={`${base}/account/orders`}>
              View Orders
            </Link>
          </Button>
          <Link href={`${base}/products`} className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-[#F8FAFC] hover:bg-card transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = order.status === "paid"
    ? "text-emerald-400 bg-emerald-500/10"
    : order.status === "pending"
      ? "text-amber-400 bg-amber-500/10"
      : "text-muted-foreground bg-muted/10";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-8">
        <CheckCircle size={64} className="mx-auto text-emerald-500 mb-4" />
        <h1 className="text-3xl font-bold text-[#F8FAFC]">Payment Successful!</h1>
        <p className="mt-2 text-muted-foreground">
          Your order <span className="font-mono text-[#F8FAFC]">#{order.number}</span> has been placed.
        </p>
        <div className="mt-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-[#F8FAFC]">Items ({order.items.length})</h3>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#18181B]">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package size={16} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#F8FAFC]">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#F8FAFC]">${(item.price * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-[#F8FAFC]">Order Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? "Free" : `$${order.shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (8%)</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-[#F8FAFC]">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.address && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-[#F8FAFC]">Shipping Address</h3>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="font-medium text-[#F8FAFC]">{order.address.label}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild size="xl">
          <Link href={`${base}/account/orders`}>
            View Orders
          </Link>
        </Button>
        <Link href={`${base}/products`} className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-[#F8FAFC] hover:bg-card transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
