"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import ProductForm from "@/components/dashboard/product-form";

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/v1/products/${id}`),
        fetch("/api/v1/categories"),
      ]);
      if (!prodRes.ok) throw new Error("Product not found");
      setProduct(await prodRes.json());
      const catData = await catRes.json();
      setCategories(catData.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = useCallback(async (data: any) => {
    const res = await fetch(`/api/v1/products/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Update failed");
    router.push(`/merchant/products/${id}`);
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-24 text-center">
        <Loader2 size={28} className="animate-spin text-[#7C3AED]" />
        <p className="mt-4 text-sm text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-24 text-center">
        <AlertCircle size={32} className="text-rose-400" />
        <h3 className="mt-4 text-lg font-semibold text-[#F8FAFC]">{error || "Product not found"}</h3>
        <button onClick={() => router.push("/merchant/products")} className="mt-4 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8B5CF6]">
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-[#F8FAFC]">
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
