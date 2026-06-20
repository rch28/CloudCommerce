"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, Star, Award, TrendingUp, Plus, Pencil, Trash2, Search, Loader2, AlertCircle, Check, X, Settings, Users, History, Ticket } from "lucide-react";
import { loyaltyApi } from "@/services/loyalty.service";
import DataTable from "@/components/dashboard/data-table";
import EmptyState from "@/components/dashboard/empty-state";
import ErrorState from "@/components/dashboard/error-state";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import type { Column } from "@/components/dashboard/data-table";
import { toast } from "sonner";

const TABS = ["Rules", "Customers", "Transactions", "Settings"] as const;

interface RewardRuleItem {
  id: string; name: string; type: string; eventType: string; points: number;
  value: number | null; valueType: string | null; minPoints: number | null;
  maxRedemptions: number | null; isActive: boolean; startsAt: string | null;
  endsAt: string | null; createdAt: string;
}

interface TransactionItem {
  id: string; accountId: string; type: string; points: number;
  balanceBefore: number; balanceAfter: number; referenceType: string | null;
  referenceId: string | null; description: string | null; createdAt: string;
  account?: { customerId: string; customer: { name: string; email: string } };
}

interface CustomerLoyalty {
  id: string; customerId: string; customer: { name: string; email: string };
  points: number; lifetimePoints: number; tier: string; enrolledAt: string;
}

const typeLabels: Record<string, string> = {
  earn_points: "Earn Points",
  redeem_discount: "Redeem Discount",
  redeem_free_shipping: "Free Shipping",
};

const eventLabels: Record<string, string> = {
  purchase: "Purchase",
  signup: "Sign Up",
  referral: "Referral",
  review: "Review",
  birthday: "Birthday",
};

const tierColors: Record<string, string> = {
  bronze: "text-amber-700 bg-amber-100",
  silver: "text-gray-600 bg-gray-100",
  gold: "text-yellow-700 bg-yellow-100",
  platinum: "text-sky-700 bg-sky-100",
};

function RuleFormDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  initial?: RewardRuleItem | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "earn_points");
  const [eventType, setEventType] = useState(initial?.eventType ?? "purchase");
  const [points, setPoints] = useState(String(initial?.points ?? ""));
  const [value, setValue] = useState(initial?.value ? String(initial.value) : "");
  const [valueType, setValueType] = useState(initial?.valueType ?? "fixed");
  const [minPoints, setMinPoints] = useState(initial?.minPoints ? String(initial.minPoints) : "");
  const [maxRedemptions, setMaxRedemptions] = useState(initial?.maxRedemptions ? String(initial.maxRedemptions) : "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const isRedeem = type === "redeem_discount" || type === "redeem_free_shipping";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#F8FAFC]">{initial ? "Edit Rule" : "New Rule"}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-[#F8FAFC]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
              placeholder="e.g. 10 points per $1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Rule Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
              >
                <option value="earn_points">Earn Points</option>
                <option value="redeem_discount">Redeem Discount</option>
                <option value="redeem_free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Event</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
              >
                <option value="purchase">Purchase</option>
                <option value="signup">Sign Up</option>
                <option value="referral">Referral</option>
                <option value="review">Review</option>
                <option value="birthday">Birthday</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{isRedeem ? "Points Required" : "Points"}</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                min="1"
              />
            </div>
            {isRedeem && (
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Discount Value</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>
          {isRedeem && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Value Type</label>
                <select
                  value={valueType}
                  onChange={(e) => setValueType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                >
                  <option value="fixed">Fixed ($)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Min Points</label>
                <input
                  type="number"
                  value={minPoints}
                  onChange={(e) => setMinPoints(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                  min="0"
                />
              </div>
            </div>
          )}
          {isRedeem && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Max Redemptions per Customer</label>
              <input
                type="number"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                min="0"
              />
            </div>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-[#F8FAFC]">Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              disabled={saving || !name || !points}
              onClick={async () => {
                setSaving(true);
                await onSave({ name, type, eventType, points: Number(points), value: value ? Number(value) : undefined, valueType, minPoints: minPoints ? Number(minPoints) : undefined, maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined, isActive });
                setSaving(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6] disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {initial ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoyaltyView() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Rules");
  const [rules, setRules] = useState<RewardRuleItem[]>([]);
  const [customers, setCustomers] = useState<CustomerLoyalty[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [settings, setSettings] = useState<Record<string, number> | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRuleItem | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const data = await loyaltyApi.listRules({ limit: "100" });
      setRules((data as any).items);
    } catch { /* ignore */ }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await loyaltyApi.listCustomers({ pageSize: "100" });
      const items = (data as any).items || [];
      const accounts = await Promise.all(
        items.map(async (c: { id: string; name: string; email: string }) => {
          try {
            const acc = await loyaltyApi.getAccount({ customerId: c.id });
            return { ...acc, customer: { name: c.name, email: c.email } };
          } catch {
            return null;
          }
        }),
      );
      setCustomers(accounts.filter(Boolean));
    } catch {}
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      await loyaltyApi.listRules({ limit: "1" });
      const txData = await loyaltyApi.listAuditLogs({ entityType: "loyalty_transaction", limit: "100" });
      setTransactions((txData as any).items || []);
    } catch {
      setTransactions([]);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await loyaltyApi.getSettings();
      setSettings(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([fetchRules(), fetchCustomers(), fetchTransactions(), fetchSettings()])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetchRules, fetchCustomers, fetchTransactions, fetchSettings]);

  const handleSaveRule = async (data: Record<string, unknown>) => {
    try {
      if (editingRule) {
        await loyaltyApi.updateRule(editingRule.id, data);
      } else {
        await loyaltyApi.createRule(data);
      }
      toast.success(editingRule ? "Rule updated" : "Rule created");
      setRuleDialogOpen(false);
      setEditingRule(null);
      await fetchRules();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save rule");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await loyaltyApi.deleteRule(id);
      toast.success("Rule deleted");
      await fetchRules();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      await loyaltyApi.updateSettings(settings);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    }
  };

  const ruleColumns: Column[] = [
    { key: "name", label: "Name", sortable: true, render: (item) => <span className="font-medium text-[#F8FAFC]">{String(item.name)}</span> },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (item) => {
        const t = String(item.type);
        return <span className="text-sm text-muted-foreground">{typeLabels[t] || t}</span>;
      },
    },
    {
      key: "eventType",
      label: "Event",
      sortable: true,
      render: (item) => {
        const e = String(item.eventType);
        return <span className="text-sm">{eventLabels[e] || e}</span>;
      },
    },
    { key: "points", label: "Points", sortable: true, render: (item) => <span className="font-mono text-sm">{String(item.points)}</span> },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {item.isActive ? <Check size={10} /> : <X size={10} />}
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingRule(item as unknown as RewardRuleItem); setRuleDialogOpen(true); }}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-[#F8FAFC] hover:bg-[#1E293B]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteRule(String(item.id)); }}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-[#1E293B]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const txColumns: Column[] = [
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (item) => <span className="text-sm text-muted-foreground">{new Date(String(item.createdAt)).toLocaleDateString()}</span>,
    },
    {
      key: "account",
      label: "Customer",
      render: (item) => {
        const account = item.account as { customer: { name: string; email: string } } | undefined;
        return <span className="text-sm">{account?.customer?.name ?? "—"}</span>;
      },
    },
    { key: "type", label: "Type", sortable: true, render: (item) => <span className="text-sm capitalize">{String(item.type)}</span> },
    { key: "points", label: "Points", sortable: true, render: (item) => {
      const pts = Number(item.points);
      return <span className={`font-mono text-sm ${pts > 0 ? "text-emerald-400" : "text-rose-400"}`}>{pts > 0 ? `+${pts}` : pts}</span>;
    }},
    {
      key: "referenceType",
      label: "Source",
      render: (item) => {
        const rt = String(item.referenceType ?? "");
        return <span className="text-sm text-muted-foreground capitalize">{rt || "—"}</span>;
      },
    },
    { key: "description", label: "Description", render: (item) => <span className="text-sm text-muted-foreground">{String(item.description ?? "—")}</span> },
  ];

  if (loading) return <LoadingSkeleton variant="page" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Loyalty Program</h1>
          <p className="text-sm text-muted-foreground">Manage reward rules, view customer points, and configure settings.</p>
        </div>
        {activeTab === "Rules" && (
          <button
            onClick={() => { setEditingRule(null); setRuleDialogOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6]"
          >
            <Plus size={16} /> New Rule
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const icons: Record<string, typeof Gift> = { Rules: Gift, Customers: Users, Transactions: History, Settings: Settings };
          const Icon = icons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-muted-foreground hover:text-[#F8FAFC]"
              }`}
            >
              <Icon size={15} />
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === "Rules" && (
        <DataTable
          columns={ruleColumns}
          data={rules as unknown as Record<string, unknown>[]}
          searchKeys={["name", "type", "eventType"]}
          emptyTitle="No reward rules yet"
          emptyDescription="Create your first rule to start earning loyalty points."
          pageSize={10}
        />
      )}

      {activeTab === "Customers" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium">Tier</th>
                  <th className="px-5 py-3.5 font-medium">Points</th>
                  <th className="px-5 py-3.5 font-medium">Lifetime Points</th>
                  <th className="px-5 py-3.5 font-medium">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">
                      <Users size={32} className="mx-auto mb-2 opacity-40" />
                      No customers enrolled yet
                    </td>
                  </tr>
                ) : customers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[#1E293B]">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-[#F8FAFC]">{c.customer?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{c.customer?.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[c.tier] || tierColors.bronze}`}>
                        <Star size={10} className="mr-1" />
                        {c.tier.charAt(0).toUpperCase() + c.tier.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-[#F8FAFC]">{c.points.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-muted-foreground">{c.lifetimePoints.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(c.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Transactions" && (
        <DataTable
          columns={txColumns}
          data={transactions as unknown as Record<string, unknown>[]}
          searchKeys={["type", "referenceType", "description"]}
          emptyTitle="No transactions yet"
          emptyDescription="Transactions will appear when customers earn or redeem points."
          pageSize={15}
        />
      )}

      {activeTab === "Settings" && settings && (
        <div className="max-w-lg space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
              <TrendingUp size={15} />
              Points Earning
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Points per Currency Unit</label>
                <input
                  type="number"
                  value={settings.pointsPerCurrency}
                  onChange={(e) => setSettings({ ...settings, pointsPerCurrency: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                  min="0.01"
                  step="0.01"
                />
                <p className="mt-1 text-xs text-muted-foreground">Points earned per $1 spent</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
              <Award size={15} />
              Bonus Points
            </h3>
            <div className="space-y-4">
              {(["signupPoints", "referralPoints", "reviewPoints", "birthdayPoints"] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-sm capitalize text-muted-foreground">
                    {key.replace("Points", "").replace(/([a-z])([A-Z])/g, "$1 $2")} Points
                  </label>
                  <input
                    type="number"
                    value={settings[key]}
                    onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6]"
          >
            Save Settings
          </button>
        </div>
      )}

      <RuleFormDialog
        open={ruleDialogOpen}
        onClose={() => { setRuleDialogOpen(false); setEditingRule(null); }}
        onSave={handleSaveRule}
        initial={editingRule}
      />
    </div>
  );
}
