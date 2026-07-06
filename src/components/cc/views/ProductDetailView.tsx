"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Archive, Trash2, RotateCcw, Copy, Loader2, AlertCircle, Package } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { productsApi } from "@/services/products.service";
import { Button } from "@/components/ui/button";
import Badge from "@/components/cc/Badge";
import PageHeader from "@/components/dashboard/page-header";

interface ProductData {
  id: string; name: string; slug: string; description: string | null;
  shortDescription: string | null; seoTitle: string | null; seoDescription: string | null;
  status: string; categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: { url: string; alt: string | null; sortOrder: number }[];
  variants: {
    id: string; sku: string; price: number; comparePrice: number | null;
    costPrice: number | null; weight: number | null; quantity: number;
    isDefault: boolean; status: string;
  }[];
  createdAt: string; updatedAt: string;
}

export default function ProductDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productsApi.get(id);
        if (!cancelled) setProduct(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.get(id);
      setProduct(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await productsApi.patch(product.id, { action: "archive" });
      await fetchProduct();
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleRestore = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await productsApi.patch(product.id, { action: "restore" });
      await fetchProduct();
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleDuplicate = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      const dup = await productsApi.duplicate(product.id);
      router.push(`/merchant/products/${dup.id}`);
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      await productsApi.delete(product.id);
      router.push("/merchant/products");
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <LoadingSpinner
        size={28}
        text="Loading product..."
        className="rounded-xl border border-border bg-card px-6 py-24 text-center"
        spinnerClassName="text-[#7C3AED]"
      />
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-24 text-center">
        <AlertCircle size={32} className="text-rose-400" />
        <h3 className="mt-4 text-lg font-semibold text-[#F8FAFC]">{error || "Product not found"}</h3>
        <Button onClick={() => router.push("/merchant/products")} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-[#F8FAFC]">
        <ArrowLeft size={15} /> Back
      </button>

      <PageHeader
        title={product.name}
        description={product.category?.name ?? "Uncategorized"}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/merchant/products/${product.id}/edit`)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={handleDuplicate} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-cyan-400 disabled:opacity-30">
              <Copy size={14} /> Duplicate
            </button>
            {product.status !== "archived" ? (
              <button onClick={handleArchive} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-amber-400 disabled:opacity-30">
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                Archive
              </button>
            ) : (
              <button onClick={handleRestore} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-emerald-400 disabled:opacity-30">
                <RotateCcw size={14} /> Restore
              </button>
            )}
            <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Main column */}
        <div className="col-span-2 space-y-6">
          {/* Images */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Images</h3>
            {product.images.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12">
                <Package size={32} className="text-muted-foreground/30" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {product.images.map((img, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-lg bg-[#1E293B]">
                    <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
            {product.shortDescription && (
              <p className="mb-3 text-sm text-muted-foreground italic">{product.shortDescription}</p>
            )}
            <p className="text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">{product.description || "No description provided."}</p>
          </div>

          {/* Variants */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Variants ({product.variants.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Compare</th>
                    <th className="pb-2 font-medium">Cost</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {product.variants.map((v) => (
                    <tr key={v.id} className="text-[#F8FAFC]">
                      <td className="py-2.5 font-mono text-xs">{v.sku}</td>
                      <td className="py-2.5 font-medium">${v.price.toFixed(2)}</td>
                      <td className="py-2.5 text-muted-foreground">{v.comparePrice ? `$${v.comparePrice.toFixed(2)}` : "—"}</td>
                      <td className="py-2.5 text-muted-foreground">{v.costPrice ? `$${v.costPrice.toFixed(2)}` : "—"}</td>
                      <td className="py-2.5">
                        <span className={v.quantity === 0 ? "text-rose-400" : "text-emerald-400"}>{v.quantity}</span>
                      </td>
                      <td className="py-2.5"><Badge status={v.status} /></td>
                      <td className="py-2.5">{v.isDefault ? <span className="text-[#7C3AED]">✓</span> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status</h3>
            <Badge status={product.status} />
          </div>

          {/* Pricing Summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pricing</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-medium text-[#F8FAFC]">${defaultVariant?.price.toFixed(2) ?? "0.00"}</dd>
              </div>
              {defaultVariant?.comparePrice && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Compare at</dt>
                  <dd className="text-muted-foreground line-through">${defaultVariant.comparePrice.toFixed(2)}</dd>
                </div>
              )}
              {defaultVariant?.costPrice && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cost</dt>
                  <dd className="text-muted-foreground">${defaultVariant.costPrice.toFixed(2)}</dd>
                </div>
              )}
              {defaultVariant && (
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="text-muted-foreground">Margin</dt>
                  <dd className="font-medium text-emerald-400">
                    {((defaultVariant.price - (defaultVariant.costPrice ?? 0)) / defaultVariant.price * 100).toFixed(0)}%
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Organization */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="font-mono text-xs text-[#F8FAFC]">/{product.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="text-[#F8FAFC]">{product.category?.name ?? "None"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-[#F8FAFC]">{new Date(product.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="text-[#F8FAFC]">{new Date(product.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          {/* SEO */}
          {(product.seoTitle || product.seoDescription) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">SEO</h3>
              <dl className="space-y-2 text-sm">
                {product.seoTitle && (
                  <div>
                    <dt className="text-muted-foreground text-xs">Title</dt>
                    <dd className="text-[#F8FAFC]">{product.seoTitle}</dd>
                  </div>
                )}
                {product.seoDescription && (
                  <div>
                    <dt className="text-muted-foreground text-xs">Description</dt>
                    <dd className="text-[#F8FAFC] text-xs">{product.seoDescription}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
