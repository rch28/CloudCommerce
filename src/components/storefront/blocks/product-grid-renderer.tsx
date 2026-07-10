"use client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/storefront/product-card";
import { productsApi } from "@/services/products.service";

interface ProductGridRendererProps {
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  brandColor: string;
  secondaryColor: string;
  tenant: string;
}

export default function ProductGridRenderer({ content, brandColor, tenant }: ProductGridRendererProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const title = content.title as string | undefined;

  useEffect(() => {
    async function fetchProducts() {
      try {
        const params: Record<string, string> = { pageSize: String((content.limit as number) || 8), status: "active" };
        const ids = (content.productIds as string)?.split(",").map((s: string) => s.trim()).filter(Boolean);
        if (ids?.length) params.ids = ids.join(",");
        if (content.categoryId) params.categoryId = content.categoryId as string;
        const data = await productsApi.list(params);
        setProducts(data.items ?? []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchProducts();
  }, [content.limit, content.productIds, content.categoryId]);

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {title && (
          <h2 className="mb-8 text-2xl font-bold text-[#F8FAFC]">{title}</h2>
        )}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, (content.limit as number) || 8).map((p: any) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={p.variants?.[0]?.price ?? 0}
                image={p.images?.[0]?.url ?? ""}
                stock={p.variants?.[0]?.quantity ?? 0}
                sold={p.sold ?? 0}
                tenant={tenant}
                category={p.category?.name ?? "General"}
                variantId={p.variants?.[0]?.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
