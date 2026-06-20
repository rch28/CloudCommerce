"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Loader2, CheckCircle, RefreshCw, AlertCircle, Send } from "lucide-react";
import Badge from "@/components/cc/Badge";
import { getValidTransitions, STATUS_LABELS } from "@/data/order-status";
import { ordersApi } from "@/services/orders.service";

interface TimelineEntry {
  id: string;
  action: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

interface OrderItem {
  id: string;
  variantId: string;
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
  stripeSessionId: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string; phone: string | null } | null;
  items: OrderItem[];
  address: OrderAddress | null;
  timeline: TimelineEntry[];
}

export default function MerchantOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersApi.get(id);
      setOrder(data.order);
    } catch {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
  }, [fetchOrder]);

  async function handleStatusUpdate(newStatus: string) {
    setActionLoading("status");
    try {
      await ordersApi.updateStatus(id, { status: newStatus });
      await fetchOrder();
    } catch {
      setError("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRefund() {
    if (!confirm("Are you sure you want to refund this order?")) return;
    setActionLoading("refund");
    try {
      await ordersApi.refund(id, {});
      await fetchOrder();
    } catch {
      setError("Failed to refund");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResendConfirmation() {
    setActionLoading("resend");
    try {
      await ordersApi.resendConfirmation(id);
    } catch {
      setError("Failed to resend confirmation");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle size={32} className="text-rose-400 mb-4" />
        <p className="text-muted-foreground">{error || "Order not found"}</p>
        <Link href="/merchant/orders" className="mt-4 text-sm text-[#7C3AED] hover:text-[#8B5CF6]">
          Back to orders
        </Link>
      </div>
    );
  }

  const validTransitions = getValidTransitions(order.status);
  const canRefund = (order.status === "paid" || order.status === "delivered") && order.paymentIntentId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/merchant/orders" className="rounded-lg p-1.5 text-muted-foreground hover:text-[#F8FAFC] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#F8FAFC] font-mono">#{order.number}</h1>
          <Badge status={order.status} />
        </div>
      </div>

      <p className="text-sm text-muted-foreground -mt-4">
        Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
        })}
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-4">Items ({order.items.length})</h2>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#18181B]">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#F8FAFC] truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#F8FAFC] font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">Order Summary</h2>
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
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-[#F8FAFC]">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
            {order.notes && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-[#F8FAFC]">{order.notes}</p>
              </div>
            )}
          </div>

          {order.address && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">Shipping Address</h2>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p className="font-medium text-[#F8FAFC]">{order.address.label}</p>
                <p>{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
                <p>{order.address.country}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">Timeline</h2>
            {order.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeline entries</p>
            ) : (
              <div className="space-y-0">
                {order.timeline.map((entry, i) => (
                  <div key={entry.id} className="relative flex gap-4 pb-4">
                    {i < order.timeline.length - 1 && (
                      <div className="absolute left-[11px] top-5 h-full w-px bg-border" />
                    )}
                    <div className="mt-1 shrink-0">
                      {entry.action === "created" ? (
                        <CheckCircle size={22} className="text-emerald-500" />
                      ) : (
                        <RefreshCw size={22} className="text-[#7C3AED]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#F8FAFC] capitalize">
                        {entry.action === "created" ? "Order Created" : "Status Updated"}
                      </p>
                      {entry.changes && (() => {
                        const ch = entry.changes as Record<string, unknown>;
                        return (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ch.from && (
                              <>From <Badge status={String(ch.from)} /> → <Badge status={String(ch.to)} /></>
                            )}
                            {ch.emailResent && <>Confirmation email resent</>}
                            {ch.number && <>Order #{ch.number} created</>}
                          </p>
                        );
                      })()}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.createdAt).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">Customer</h2>
            {order.customer ? (
              <div className="space-y-1.5 text-sm">
                <p className="font-medium text-[#F8FAFC]">{order.customer.name}</p>
                <p className="text-muted-foreground">{order.customer.email}</p>
                {order.customer.phone && <p className="text-muted-foreground">{order.customer.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Guest checkout</p>
            )}
          </div>

          {order.stripeSessionId && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">Payment</h2>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {order.paymentIntentId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Intent</p>
                    <p className="font-mono text-xs text-[#F8FAFC] break-all">{order.paymentIntentId}</p>
                  </div>
                )}
                {order.chargeId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Charge ID</p>
                    <p className="font-mono text-xs text-[#F8FAFC] break-all">{order.chargeId}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Stripe Session</p>
                  <p className="font-mono text-xs text-[#F8FAFC] break-all">{order.stripeSessionId}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">Actions</h2>
            {validTransitions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {validTransitions.map((status) => (
                    <button
                      key={status}
                      disabled={actionLoading === "status"}
                      onClick={() => handleStatusUpdate(status)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8B5CF6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === "status" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle size={12} />
                      )}
                      Mark as {STATUS_LABELS[status] || status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {validTransitions.length > 0 && <div className="mt-3 border-t border-border" />}

            <div className="mt-3 space-y-2">
              {canRefund && (
                <button
                  disabled={actionLoading === "refund"}
                  onClick={handleRefund}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === "refund" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  Refund Payment
                </button>
              )}

              <button
                disabled={actionLoading === "resend"}
                onClick={handleResendConfirmation}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-[#F8FAFC] hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "resend" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Resend Confirmation
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
