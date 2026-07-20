"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, ArrowUpRight, Loader2, AlertCircle, Download, Receipt, ChevronUp, ChevronDown } from "lucide-react";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import { billingApi } from "@/services/billing.service";
import { PLANS, type PlanFeatures } from "@/lib/features";

interface SubscriptionData {
  id: string;
  planSlug: string;
  planName: string;
  planPrice: number;
  status: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  trialEndsAt: string | null;
}

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  invoiceUrl: string | null;
  description: string | null;
  createdAt: string;
}

export default function BillingView() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }

  const sortedPayments = useMemo(() => {
    if (!sortKey) return payments;
    return [...payments].sort((a, b) => {
      const aVal = a[sortKey as keyof PaymentData];
      const bVal = b[sortKey as keyof PaymentData];
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [payments, sortKey, sortOrder]);

  useEffect(() => {
    async function loadBilling() {
      try {
        const [subData, payData] = await Promise.all([
          billingApi.getSubscription(),
          billingApi.listPayments(),
        ]);
        setSubscription(subData);
        setPayments(payData);
      } catch {
        setError("Failed to load billing data");
      } finally {
        setLoading(false);
      }
    }
    loadBilling();
  }, []);

  async function handlePlanChange(newSlug: string) {
    setChanging(true);
    setError("");
    try {
      const updated = await billingApi.updateSubscription({ planSlug: newSlug });
      setSubscription(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChanging(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setChanging(true);
    setError("");
    try {
      const updated = await billingApi.createSubscription({ action: "cancel" });
      setSubscription(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChanging(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton variant="billing-page" />;
  }

  const currentPlan = subscription?.planSlug ? PLANS[subscription.planSlug as keyof typeof PLANS] : null;
  const planKeys = Object.keys(PLANS) as Array<keyof typeof PLANS>;

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-300">&times;</button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#7C3AED]" />
            <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
          </div>
          {subscription && subscription.status !== "canceled" && (
            <button onClick={handleCancel} disabled={changing} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 transition-colors">
              Cancel Subscription
            </button>
          )}
        </div>

        {subscription ? (
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{subscription.planName}</p>
              <p className="text-sm text-muted-foreground">${subscription.planPrice}/mo</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              subscription.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
              subscription.status === "trialing" ? "bg-amber-500/20 text-amber-400" :
              subscription.status === "past_due" ? "bg-rose-500/20 text-rose-400" :
              "bg-slate-500/20 text-muted-foreground"
            }`}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
            {subscription.status === "canceled" && subscription.canceledAt && (
              <span className="text-sm text-muted-foreground">Canceled: {new Date(subscription.canceledAt).toLocaleDateString()}</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active subscription</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Plans</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {planKeys.map((key) => {
            const plan = PLANS[key] as PlanFeatures & { slug: string; name: string; price: number };
            const isCurrent = subscription?.planSlug === plan.slug;
            const isCanceled = subscription?.status === "canceled";

            return (
              <div key={plan.slug} className={`rounded-xl border p-5 ${isCurrent ? "border-[#7C3AED] bg-[#7C3AED]/10" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  {isCurrent && <span className="rounded-full bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold text-white">CURRENT</span>}
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    {plan.maxProducts === -1 ? "Unlimited products" : `${plan.maxProducts} products`}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    {plan.analytics === "none" ? "No analytics" : plan.analytics === "basic" ? "Basic analytics" : "Advanced analytics"}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    {plan.customDomain ? "Custom domain" : "Subdomain only"}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    {plan.prioritySupport ? "Priority support" : "Email support"}
                  </li>
                </ul>
                <Button
                  onClick={() => handlePlanChange(plan.slug)}
                  disabled={isCurrent || changing || isCanceled}
                  variant={isCurrent ? "outline" : "default"}
                  className="mt-4 w-full"
                >
                  {changing ? <Loader2 size={14} className="mx-auto animate-spin" /> : isCurrent ? "Current Plan" : isCanceled ? "Reactivate" : plan.price > (currentPlan?.price ?? 0) ? "Upgrade" : "Downgrade"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={18} className="text-[#7C3AED]" />
          <h2 className="text-lg font-semibold text-foreground">Invoice History</h2>
        </div>
        {payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No invoices yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("createdAt")}>
                    <span className="inline-flex items-center gap-1">Date {sortKey === "createdAt" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="pb-3 pr-4 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("description")}>
                    <span className="inline-flex items-center gap-1">Description {sortKey === "description" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="pb-3 pr-4 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("amount")}>
                    <span className="inline-flex items-center gap-1">Amount {sortKey === "amount" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="pb-3 pr-4 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("status")}>
                    <span className="inline-flex items-center gap-1">Status {sortKey === "status" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="pb-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("provider")}>
                    <span className="inline-flex items-center gap-1">Provider {sortKey === "provider" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="pb-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 text-foreground">
                    <td className="py-3 pr-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{p.description || "Subscription payment"}</td>
                    <td className="py-3 pr-4 font-medium">${Number(p.amount).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        p.status === "succeeded" ? "bg-emerald-500/20 text-emerald-400" :
                        p.status === "failed" ? "bg-rose-500/20 text-rose-400" :
                        "bg-amber-500/20 text-amber-400"
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground capitalize">{p.provider}</td>
                    <td className="py-3">
                      {p.invoiceUrl ? (
                        <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#7C3AED] hover:text-[#8B5CF6]">
                          <Download size={14} /> PDF
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpRight size={18} className="text-[#7C3AED]" />
          <h2 className="text-lg font-semibold text-foreground">Usage</h2>
        </div>
        {subscription && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Products", used: 12, limit: currentPlan?.maxProducts ?? 0 },
              { label: "Staff accounts", used: 2, limit: currentPlan?.maxStaff ?? 0 },
            ].map((item) => {
              const pct = item.limit === -1 ? 0 : item.limit > 0 ? Math.round((item.used / item.limit) * 100) : 0;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground">{item.limit === -1 ? `${item.used} / Unlimited` : `${item.used} / ${item.limit}`}</span>
                  </div>
                  {item.limit !== -1 && (
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full bg-[#7C3AED] transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
