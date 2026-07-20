"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Percent, Truck, ChevronUp, ChevronDown } from "lucide-react";
import { promotionsApi } from "@/services/promotions.service";
import { Skeleton } from "@/components/ui/skeleton";
import ActionButtons from "@/components/ui/action-buttons";
import SearchField from "@/components/ui/form-inputs/SearchField";
import { useSearch } from "@/hooks/useSearch";

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
  const { search, setSearch, debouncedSearch } = useSearch();
  const [loading, setLoading] = useState(true);
  const [couponSortKey, setCouponSortKey] = useState<string | null>(null);
  const [couponSortOrder, setCouponSortOrder] = useState<"asc" | "desc">("asc");
  const [promotionSortKey, setPromotionSortKey] = useState<string | null>(null);
  const [promotionSortOrder, setPromotionSortOrder] = useState<"asc" | "desc">("asc");

  function handleCouponSort(key: string) {
    if (couponSortKey === key) {
      setCouponSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setCouponSortKey(key);
      setCouponSortOrder("asc");
    }
  }

  function handlePromotionSort(key: string) {
    if (promotionSortKey === key) {
      setPromotionSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setPromotionSortKey(key);
      setPromotionSortOrder("asc");
    }
  }

  const sortedCoupons = useMemo(() => {
    if (!couponSortKey) return coupons;
    return [...coupons].sort((a, b) => {
      const aVal = a[couponSortKey as keyof CouponItem];
      const bVal = b[couponSortKey as keyof CouponItem];
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { numeric: true });
      return couponSortOrder === "asc" ? cmp : -cmp;
    });
  }, [coupons, couponSortKey, couponSortOrder]);

  const sortedPromotions = useMemo(() => {
    if (!promotionSortKey) return promotions;
    return [...promotions].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;
      if (promotionSortKey === "_count") {
        aVal = a._count.usages;
        bVal = b._count.usages;
      } else {
        aVal = a[promotionSortKey as keyof PromotionItem];
        bVal = b[promotionSortKey as keyof PromotionItem];
      }
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { numeric: true });
      return promotionSortOrder === "asc" ? cmp : -cmp;
    });
  }, [promotions, promotionSortKey, promotionSortOrder]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([
        (async () => {
          try {
            const data = await promotionsApi.listCoupons({ search: debouncedSearch, pageSize: "100" });
            if (!cancelled) setCoupons((data as any).items);
          } catch { /* ignore */ }
        })(),
        (async () => {
          try {
            const data = await promotionsApi.listPromotions({ pageSize: "100" });
            if (!cancelled) setPromotions((data as any).items);
          } catch { /* ignore */ }
        })(),
        (async () => {
          try {
            await promotionsApi.listCoupons({ pageSize: "1" });
            if (!cancelled) setUsageStats({ totalDiscount: 0, totalOrders: 0, totalUsages: 0, byType: {} });
          } catch { /* ignore */ }
        })(),
      ]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-1 border-b border-border">
          {[1,2,3].map((i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-t-md" />
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            ))}
          </div>
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
          <SearchField
            searchQuery={search}
            setSearchQuery={setSearch}
            placeholder="Search coupons..."
          />
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleCouponSort("code")}>
                    <span className="inline-flex items-center gap-1">Code {couponSortKey === "code" && (couponSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleCouponSort("type")}>
                    <span className="inline-flex items-center gap-1">Type {couponSortKey === "type" && (couponSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleCouponSort("value")}>
                    <span className="inline-flex items-center gap-1">Value {couponSortKey === "value" && (couponSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleCouponSort("currentUses")}>
                    <span className="inline-flex items-center gap-1">Uses {couponSortKey === "currentUses" && (couponSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleCouponSort("isActive")}>
                    <span className="inline-flex items-center gap-1">Status {couponSortKey === "isActive" && (couponSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleCouponSort("expiresAt")}>
                    <span className="inline-flex items-center gap-1">Expires {couponSortKey === "expiresAt" && (couponSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sortedCoupons.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No coupons yet</td></tr>
                ) : sortedCoupons.map((c) => (
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
                      <ActionButtons
                        actions={[
                          { type: "view", tooltip: "View coupon details", onClick: () => router.push(`/merchant/promotions/coupons/${c.id}`) },
                        ]}
                      />
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
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handlePromotionSort("name")}>
                    <span className="inline-flex items-center gap-1">Name {promotionSortKey === "name" && (promotionSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handlePromotionSort("type")}>
                    <span className="inline-flex items-center gap-1">Type {promotionSortKey === "type" && (promotionSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handlePromotionSort("discountValue")}>
                    <span className="inline-flex items-center gap-1">Discount {promotionSortKey === "discountValue" && (promotionSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handlePromotionSort("_count")}>
                    <span className="inline-flex items-center gap-1">Uses {promotionSortKey === "_count" && (promotionSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handlePromotionSort("isActive")}>
                    <span className="inline-flex items-center gap-1">Status {promotionSortKey === "isActive" && (promotionSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handlePromotionSort("expiresAt")}>
                    <span className="inline-flex items-center gap-1">Expires {promotionSortKey === "expiresAt" && (promotionSortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sortedPromotions.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No promotions yet</td></tr>
              ) : sortedPromotions.map((p) => (
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
                  <td className="px-4 py-3">
                    <ActionButtons
                      actions={[
                        { type: "view", tooltip: "View promotion details", onClick: () => router.push(`/merchant/promotions/promotions/${p.id}`) },
                      ]}
                    />
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
