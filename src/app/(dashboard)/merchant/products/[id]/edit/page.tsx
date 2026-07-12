"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/dashboard/product-form";
import { productsApi } from "@/services/products.service";
import { categoriesApi } from "@/services/categories.service";

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [productData, catData] = await Promise.all([
          productsApi.get(id),
          categoriesApi.list(),
        ]);
        if (!cancelled) {
          setProduct(productData);
          setCategories(catData.items ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = useCallback(async (data: any) => {
    await productsApi.update(id, data);
    router.push(`/merchant/products/${id}`);
  }, [id, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <div className="flex gap-3">
                {[1,2,3].map((i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-24 text-center">
        <AlertCircle size={32} className="text-rose-400" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">{error || "Product not found"}</h3>
        <Button onClick={() => router.push("/merchant/products")} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={15} /> Back
      </button>

      <ProductForm
        open={true}
        onOpenChange={() => router.back()}
        product={product}
        categories={categories}
        onSave={handleSave}
      />
    </div>
  );
}
