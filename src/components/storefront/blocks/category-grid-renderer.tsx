"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesApi } from "@/services/categories.service";

interface CategoryGridRendererProps {
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  brandColor: string;
  secondaryColor: string;
  tenant: string;
}

export default function CategoryGridRenderer({ content, brandColor, tenant }: CategoryGridRendererProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const title = content.title as string | undefined;
  const categoryIds = content.categoryIds as string | undefined;
  const limit = (content.limit as number) || 6;

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await categoriesApi.list();
        const ids = categoryIds?.split(",").map((s: string) => s.trim()).filter(Boolean);
        let items = data.items ?? [];
        if (ids?.length) items = items.filter((c: any) => ids.includes(c.id));
        setCategories(items.slice(0, limit));
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchCategories();
  }, [categoryIds, limit]);

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {title && (
          <h2 className="mb-8 text-2xl font-bold text-foreground">{title}</h2>
        )}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-muted-foreground">No categories found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/store/${tenant}/products?category=${cat.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <span className="text-4xl font-bold opacity-20">{cat.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-medium text-foreground group-hover:text-[#8B5CF6] transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
