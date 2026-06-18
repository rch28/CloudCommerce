import type { Metadata } from "next";
import Link from "next/link";
import { categoryRepo } from "@/lib/services/categories";
import { productRepo } from "@/lib/services/products";
import { getSettingsBySlug } from "@/lib/services/settings";
import { CATEGORY_PAGE_REVALIDATE } from "@/lib/storefront";

export const revalidate = CATEGORY_PAGE_REVALIDATE;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }): Promise<Metadata> {
  const { tenant } = await params;
  const store = await getSettingsBySlug(tenant).catch(() => null);
  const name = store?.name || tenant.charAt(0).toUpperCase() + tenant.slice(1);
  return {
    title: "Categories",
    description: `Browse product categories at ${name}.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `/store/${tenant}/categories` },
  };
}

export default async function CategoriesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const catResult = await categoryRepo.list(tenant);
  const categories = catResult.items;

  const productCounts: Record<string, number> = {};
  const allProducts = await productRepo.list(tenant, { status: "active", pageSize: 1000 });
  for (const p of allProducts.items as any[]) {
    if (p.categoryId) productCounts[p.categoryId] = (productCounts[p.categoryId] || 0) + 1;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F8FAFC]">Categories</h1>
        <p className="mt-1 text-muted-foreground">{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">No categories yet</p>
          <Link href={`/store/${tenant}/products`} className="mt-4 text-sm font-medium text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat: any) => (
            <Link key={cat.id} href={`/store/${tenant}/products?category=${cat.id}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-[#7C3AED]/50"
            >
              <h2 className="text-lg font-semibold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">{cat.name}</h2>
              {cat.description && <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>}
              <p className="mt-3 text-xs text-muted-foreground">{productCounts[cat.id] || 0} product{(productCounts[cat.id] || 0) !== 1 ? "s" : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
