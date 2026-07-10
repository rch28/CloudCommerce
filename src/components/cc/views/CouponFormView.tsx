"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { promotionsApi } from "@/services/promotions.service";

interface Props {
  mode?: "coupon" | "promotion";
  id?: string; // if provided, loads existing item for editing
}

export default function CouponFormView({ mode = "coupon", id }: Props) {
  const router = useRouter();
  const isPromotion = mode === "promotion";
  const isEditing = !!id;

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    type: "fixed",
    value: "",
    maxDiscount: "",
    minOrderAmount: "",
    maxUses: "",
    appliesTo: "all",
    firstOrderOnly: false,
    isActive: true,
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: "",
    productIds: "",
    categoryIds: "",
    customerIds: "",
    discountType: "fixed",
    discountValue: "",
    priority: "0",
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing data for edit mode
  useEffect(() => {
    if (!id) return;
    const loader = isPromotion ? promotionsApi.getPromotion(id) : promotionsApi.getCoupon(id);
    loader.then((data) => {
      if (isPromotion) {
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          description: data.description || "",
          discountType: data.discountType || "fixed",
          discountValue: String(data.discountValue || ""),
          maxDiscount: data.maxDiscount ? String(data.maxDiscount) : "",
          priority: String(data.priority || "0"),
          isActive: data.isActive,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString().slice(0, 16) : prev.startsAt,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : "",
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          code: data.code || "",
          type: data.type || "fixed",
          value: String(data.value || ""),
          maxDiscount: data.maxDiscount ? String(data.maxDiscount) : "",
          minOrderAmount: data.minOrderAmount ? String(data.minOrderAmount) : "",
          maxUses: data.maxUses ? String(data.maxUses) : "",
          appliesTo: data.appliesTo || "all",
          productIds: (data.productIds || []).join(", "),
          categoryIds: (data.categoryIds || []).join(", "),
          customerIds: (data.customerIds || []).join(", "),
          firstOrderOnly: data.firstOrderOnly || false,
          isActive: data.isActive,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString().slice(0, 16) : prev.startsAt,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : "",
        }));
      }
      setLoading(false);
    });
  }, [id, isPromotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const body = isPromotion ? {
        name: form.name,
        description: form.description || undefined,
        type: "automatic",
        priority: parseInt(form.priority) || 0,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: form.isActive,
        rules: [],
      } : {
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        appliesTo: form.appliesTo,
        productIds: form.productIds ? form.productIds.split(",").map(s => s.trim()).filter(Boolean) : [],
        categoryIds: form.categoryIds ? form.categoryIds.split(",").map(s => s.trim()).filter(Boolean) : [],
        customerIds: form.customerIds ? form.customerIds.split(",").map(s => s.trim()).filter(Boolean) : [],
        firstOrderOnly: form.firstOrderOnly,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: form.isActive,
      };

      if (isEditing) {
        if (isPromotion) {
          await promotionsApi.updatePromotion(id!, body);
        } else {
          await promotionsApi.updateCoupon(id!, body);
        }
      } else {
        if (isPromotion) {
          await promotionsApi.createPromotion(body);
        } else {
          await promotionsApi.createCoupon(body);
        }
      }

      router.push("/merchant/promotions");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isPromotion) {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">New Promotion</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Value <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Discount (optional)</label>
            <input type="number" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires (optional)</label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Saving..." : isEditing ? "Update Promotion" : "Create Promotion"}
            </button>
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? "Edit Coupon" : "New Coupon"}</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium mb-1">Coupon Code <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. SAVE20"
            required
            className="w-full px-3 py-2 border rounded-md text-sm font-mono uppercase"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Discount Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm">
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div>
              <label className="block text-sm font-medium mb-1">Value <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        </div>
        {form.type === "percentage" && (
          <div>
            <label className="block text-sm font-medium mb-1">Max Discount (cap)</label>
            <input type="number" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Minimum Order Amount</label>
          <input type="number" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Uses</label>
          <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Applies To</label>
          <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm">
            <option value="all">All Items</option>
            <option value="products">Specific Products</option>
            <option value="categories">Specific Categories</option>
            <option value="customers">Specific Customers</option>
          </select>
        </div>
        {form.appliesTo === "products" && (
          <div>
            <label className="block text-sm font-medium mb-1">Product IDs (comma-separated)</label>
            <input type="text" value={form.productIds} onChange={(e) => setForm({ ...form, productIds: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        )}
        {form.appliesTo === "categories" && (
          <div>
            <label className="block text-sm font-medium mb-1">Category IDs (comma-separated)</label>
            <input type="text" value={form.categoryIds} onChange={(e) => setForm({ ...form, categoryIds: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        )}
        {form.appliesTo === "customers" && (
          <div>
            <label className="block text-sm font-medium mb-1">Customer IDs (comma-separated)</label>
            <input type="text" value={form.customerIds} onChange={(e) => setForm({ ...form, customerIds: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="firstOrderOnly" checked={form.firstOrderOnly} onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })} />
          <label htmlFor="firstOrderOnly" className="text-sm">First order only</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expires (optional)</label>
            <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <label htmlFor="isActive" className="text-sm">Active</label>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Saving..." : isEditing ? "Update Coupon" : "Create Coupon"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
