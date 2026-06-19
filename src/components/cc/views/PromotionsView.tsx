"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Tag, Percent, Truck, MoreHorizontal } from "lucide-react";

const TABS = ["Coupons", "Promotions", "Usage Analytics"] as const;

interface CouponItem {
  id: string; code: string; type: string; value: number; currentUses: number;
  maxUses: number | null; isActive: boolean; expiresAt: string | null;
}

interface PromotionItem {
  id: string; name: string; type: string; discountType: string;
  discountValue: number; isActive: boolean; expiresAt: string | null;
  _count: { usages: number };
}

interface UsageStats {
  totalDiscount: number; totalOrders: number; totalUsages: number; byType: Record<string, { count: number; total: number }>;
}

export default function PromotionsView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Coupons");
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    const res = await fetch(`/api/v1/coupons?search=${search}&pageSize=100`);
    if (res.ok) { const data = await res.json(); setCoupons(data.items); }
  }, [search]);

  const fetchPromotions = useCallback(async () => {
    const res = await fetch("/api/v1/promotions?pageSize=100");
    if (res.ok) { const data = await res.json(); setPromotions(data.items); }
  }, []);

  const fetchUsage = useCallback(async () => {
    const res = await fetch("/api/v1/coupons?pageSize=1");
    if (res.ok) {
      setUsageStats({ totalDiscount: 0, totalOrders: 0, totalUsages: 0, byType: {} });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCoupons(), fetchPromotions(), fetchUsage()]).finally(() => setLoading(false));
  }, [fetchCoupons, fetchPromotions, fetchUsage]);

  const typeIcon = (type: string) => {
    switch (type) {
      case "fixed": return <Tag size={14} className="text-blue-500" />;
      case "percentage": return <Percent size={14} className="text-green-500" />;
      case "free_shipping": return <Truck size={14} className="text-purple-500" />;
      default: return null;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "fixed": return "Fixed";
      case "percentage": return "Percentage";
      case "free_shipping": return "Free Shipping";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <div className="flex gap-2">
          {activeTab === "Coupons" && (
            <button
              onClick={() => router.push("/merchant/promotions/coupons/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <Plus size={16} /> New Coupon
            </button>
          )}
          {activeTab === "Promotions" && (
            <button
              onClick={() => router.push("/merchant/promotions/promotions/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <Plus size={16} /> New Promotion
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Coupons" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm"
            />
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Value</th>
                  <th className="text-left px-4 py-3 font-medium">Uses</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Expires</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No coupons yet</td></tr>
                ) : coupons.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/merchant/promotions/coupons/${c.id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        {typeIcon(c.type)} {typeLabel(c.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.type === "percentage" ? `${c.value}%` : `$${c.value.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3">
                      {c.currentUses}{c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {c.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-muted rounded">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Promotions" && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Discount</th>
                <th className="text-left px-4 py-3 font-medium">Uses</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No promotions yet</td></tr>
              ) : promotions.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/merchant/promotions/promotions/${p.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 capitalize">{p.type.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {typeIcon(p.discountType)} {p.discountType === "percentage" ? `${p.discountValue}%` : `$${Number(p.discountValue).toFixed(2)}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p._count.usages}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "Usage Analytics" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Discount Given</p>
            <p className="text-2xl font-bold">${usageStats?.totalDiscount.toFixed(2) ?? "0.00"}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Orders with Discounts</p>
            <p className="text-2xl font-bold">{usageStats?.totalOrders ?? 0}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Usages</p>
            <p className="text-2xl font-bold">{usageStats?.totalUsages ?? 0}</p>
          </div>
          {usageStats?.byType && Object.entries(usageStats.byType).map(([type, data]) => (
            <div key={type} className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground capitalize">{type.replace("_", " ")}</p>
              <p className="text-2xl font-bold">{data.count} uses</p>
              <p className="text-sm text-muted-foreground">${data.total.toFixed(2)} total</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
