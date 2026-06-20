"use client";

import React from "react";
import { Gift, Star, Award, TrendingUp, Ticket, Truck, Loader2 } from "lucide-react";

const tierColors: Record<string, string> = {
  bronze: "text-amber-700 bg-amber-100",
  silver: "text-gray-600 bg-gray-100",
  gold: "text-yellow-700 bg-yellow-100",
  platinum: "text-sky-700 bg-sky-100",
};

const tierNames: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const tierMinPoints: Record<string, number> = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
};

interface AccountData {
  id: string; points: number; lifetimePoints: number; tier: string;
  enrolledAt: string; transactions: Array<{
    id: string; type: string; points: number; referenceType: string | null;
    description: string | null; createdAt: string;
  }>;
}

interface RuleData {
  id: string; name: string; type: string; eventType: string; points: number;
  value: number | null; valueType: string | null;
}

export default function CustomerLoyaltyPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const [account, setAccount] = React.useState<AccountData | null>(null);
  const [rules, setRules] = React.useState<RuleData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/v1/loyalty/account").then((r) => r.ok ? r.json() : null),
      fetch("/api/v1/loyalty/rules?isActive=true&limit=100").then((r) => r.ok ? r.json() : { items: [] }),
    ])
      .then(([accData, rulesData]) => {
        if (accData) setAccount(accData);
        setRules(rulesData.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nextTier = account ? Object.entries(tierMinPoints).find(([, min]) => min > (account?.lifetimePoints ?? 0)) : null;
  const progress = nextTier
    ? ((account?.lifetimePoints ?? 0) / nextTier[1]) * 100
    : 100;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#F8FAFC]">Loyalty Program</h2>

      {!account ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Gift size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold text-[#F8FAFC]">Join Our Loyalty Program</h3>
          <p className="mb-6 text-sm text-muted-foreground">Earn points on every purchase and unlock exclusive rewards.</p>
          <button
            onClick={() => {
              fetch("/api/v1/loyalty/account?customerId=self", { method: "POST" })
                .then(() => window.location.reload());
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6]"
          >
            <Gift size={16} />
            Enroll Now
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${tierColors[account.tier] || tierColors.bronze}`}>
                    <Star size={12} />
                    {tierNames[account.tier] || "Bronze"}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-[#F8FAFC]">{account.points.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Available Points</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Lifetime Points</p>
                <p className="text-xl font-semibold text-[#F8FAFC]">{account.lifetimePoints.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {nextTier ? `Next tier: ${tierNames[nextTier[0]]}` : "Highest tier reached!"}
                </span>
                <span className="text-muted-foreground">{nextTier ? `${account.lifetimePoints} / ${nextTier[1]}` : ""}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
              <TrendingUp size={15} />
              Recent Activity
            </h3>
            {account.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {account.transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
                    <div>
                      <p className="text-sm text-[#F8FAFC] capitalize">{tx.referenceType || tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.description || new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-mono text-sm font-medium ${tx.points > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
              <Award size={15} />
              How to Earn Points
            </h3>
            {rules.filter((r) => r.type === "earn_points").length === 0 ? (
              <p className="text-sm text-muted-foreground">No earn rules configured yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rules.filter((r) => r.type === "earn_points").map((rule) => (
                  <div key={rule.id} className="rounded-lg border border-border bg-[#09090B] p-3">
                    <p className="mb-1 text-sm font-medium text-[#F8FAFC]">{rule.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{rule.eventType} &middot; {rule.points} pts</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
              <Ticket size={15} />
              Redeem Options
            </h3>
            {rules.filter((r) => r.type === "redeem_discount" || r.type === "redeem_free_shipping").length === 0 ? (
              <p className="text-sm text-muted-foreground">No redemption options available.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rules.filter((r) => r.type === "redeem_discount" || r.type === "redeem_free_shipping").map((rule) => {
                  const canRedeem = account.points >= (rule.type === "redeem_free_shipping" ? (rule as RuleData).points || 0 : rule.points);
                  return (
                    <div key={rule.id} className={`rounded-lg border p-3 ${canRedeem ? "border-[#7C3AED]/30" : "border-border opacity-60"}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="mb-1 text-sm font-medium text-[#F8FAFC]">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rule.type === "redeem_free_shipping" ? "Free Shipping" : rule.value ? `${rule.valueType === "percentage" ? rule.value + "%" : "$" + rule.value + " off"}` : ""}
                          </p>
                        </div>
                        {rule.type === "redeem_free_shipping" ? <Truck size={16} className="text-purple-400" /> : <Ticket size={16} className="text-[#7C3AED]" />}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{rule.points} points required</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
