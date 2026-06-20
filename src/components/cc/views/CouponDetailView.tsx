"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { promotionsApi } from "@/services/promotions.service";

interface Props {
  mode?: "coupon" | "promotion";
}

type CouponPromotionItem = {
  name?: string; code?: string; discountType?: string; type?: string; isActive?: boolean;
  value?: string | number; discountValue?: string | number;
  maxDiscount?: string | number; minOrderAmount?: string | number;
  maxUses?: number; currentUses?: number; startsAt?: string; expiresAt?: string;
  firstOrderOnly?: boolean; createdAt?: string; appliesTo?: string;
};

interface UsageRecord {
  id: string; orderId: string; discountAmount: number; discountType: string;
  discountCode: string | null; customerId: string | null; createdAt: string;
}

export default function CouponDetailView({ mode = "coupon" }: Props) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isPromotion = mode === "promotion";

  const [item, setItem] = useState<CouponPromotionItem | null>(null);
  const [usages, setUsages] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchItem = async () => {
    try {
      const data = isPromotion ? await promotionsApi.getPromotion(id) : await promotionsApi.getCoupon(id);
      setItem(data as CouponPromotionItem);
    } catch {
      setError("Not found");
    }
  };

  const fetchUsage = async () => {
    if (isPromotion) return;
    try {
      const data = await promotionsApi.getCouponUsage(id);
      setUsages(data as unknown as UsageRecord[]);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchItem(), fetchUsage()]).finally(() => setLoading(false));
  }, [id]);

  const toggleActive = async () => {
    if (!item) return;
    try {
      if (isPromotion) {
        await promotionsApi.updatePromotion(id, { isActive: !item.isActive });
      } else {
        await promotionsApi.updateCoupon(id, { isActive: !item.isActive });
      }
      setItem({ ...item, isActive: !item.isActive });
    } catch { /* ignore */ }
  };

  if (loading) return <div className="p-6 space-y-4"><div className="h-8 w-64 bg-muted animate-pulse rounded" /><div className="h-32 bg-muted animate-pulse rounded" /></div>;
  if (error) return <div className="p-6"><p className="text-red-500">{error}</p></div>;
  if (!item) return null;

  const typeLabel = (t: string | undefined) => {
    switch (t) { case "fixed": return "Fixed Amount"; case "percentage": return "Percentage"; case "free_shipping": return "Free Shipping"; default: return t; }
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/merchant/promotions")} className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
            &larr; Back to Promotions
          </button>
          <h1 className="text-2xl font-bold">
            {isPromotion ? item.name : item.code}
          </h1>
          <p className="text-sm text-muted-foreground">{typeLabel(isPromotion ? item.discountType : item.type)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleActive}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
              item.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"
            }`}
          >
            {item.isActive ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => router.push(isPromotion ? `/merchant/promotions/promotions/${id}/edit` : `/merchant/promotions/coupons/${id}/edit`)}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isPromotion ? (
          <>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Discount</p>
              <p className="text-lg font-semibold">{item.discountType === "percentage" ? `${item.discountValue}%` : `$${Number(item.discountValue).toFixed(2)}`}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Max Discount</p>
              <p className="text-lg font-semibold">{item.maxDiscount ? `$${Number(item.maxDiscount).toFixed(2)}` : "None"}</p>
            </div>
          </>
        ) : (
          <>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Value</p>
              <p className="text-lg font-semibold">{item.type === "percentage" ? `${item.value}%` : `$${Number(item.value).toFixed(2)}`}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Usage</p>
              <p className="text-lg font-semibold">{item.currentUses}{item.maxUses ? ` / ${item.maxUses}` : ""}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Min Order</p>
              <p className="text-lg font-semibold">{item.minOrderAmount ? `$${Number(item.minOrderAmount).toFixed(2)}` : "None"}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Applies To</p>
              <p className="text-lg font-semibold capitalize">{item.appliesTo}</p>
            </div>
          </>
        )}
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-lg font-semibold">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {item.isActive ? "Active" : "Disabled"}
            </span>
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Expires</p>
          <p className="text-lg font-semibold">{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "Never"}</p>
        </div>
      </div>

      {!isPromotion && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Usage History</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium">Order</th>
                  <th className="text-left px-4 py-3 font-medium">Discount</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {usages.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No usage yet</td></tr>
                ) : usages.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{u.orderId.slice(0, 8)}...</td>
                    <td className="px-4 py-3">${Number(u.discountAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 capitalize">{u.discountType.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
