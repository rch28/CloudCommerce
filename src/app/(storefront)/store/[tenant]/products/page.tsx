import type { Metadata } from "next";
import Link from "next/link";
import { productRepo } from "@/lib/services/products";
import { categoryRepo } from "@/lib/services/categories";
import { getSettingsBySlug } from "@/lib/services/settings";
import { STOREFRONT_REVALIDATE } from "@/lib/storefront";
import ProductCard from "@/components/storefront/product-card";

export const revalidate = STOREFRONT_REVALIDATE;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }): Promise<Metadata> {
  const { tenant } = await params;
  const store = await getSettingsBySlug(tenant).catch(() => null);
  const name = store?.name || tenant.charAt(0).toUpperCase() + tenant.slice(1);
  return {
    title: "Products",
    description: `Browse all products at ${name}.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `/store/${tenant}/products` },
  };
}

export default async function ProductsPage({
  params, searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ category?: string; sort?: string; page?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const { tenant } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const catResult = await categoryRepo.list(tenant);
  const categories = catResult.items;

  const productsResult = await productRepo.list(tenant, {
    status: "active", pageSize: 12,
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(sp.minPrice ? { minPrice: Number(sp.minPrice) } : {}),
    ...(sp.maxPrice ? { maxPrice: Number(sp.maxPrice) } : {}),
    ...(sp.sort ? { sort: sp.sort } : {}),
    ...(sp.page ? { page } : {}),
  });
  const products = productsResult.items;
  const totalPages = productsResult.totalPages;

  function qs(params: Record<string, string | undefined>): string {
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    if (params.sort) sp.set("sort", params.sort);
    if (params.minPrice) sp.set("minPrice", params.minPrice);
    if (params.maxPrice) sp.set("maxPrice", params.maxPrice);
    if (params.page && params.page !== "1") sp.set("page", params.page);
    const s = sp.toString();
    return s ? `?${s}` : "";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F8FAFC]">Products</h1>
        <p className="mt-1 text-muted-foreground">{productsResult.total} product{productsResult.total !== 1 ? "s" : ""} available</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        {categories.map((cat: any) => (
          <Link
            key={cat.id}
            href={`/store/${tenant}/products${qs({ ...Object.fromEntries(Object.entries(sp).filter(([,v]) => v)), category: sp.category === cat.id ? undefined : cat.id })}`}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              sp.category === cat.id
                ? "border-[#7C3AED] bg-[#7C3AED]/20 text-[#7C3AED]"
                : "border-border text-muted-foreground hover:border-[#7C3AED]/50 hover:text-[#F8FAFC]"
            }`}
          >
            {cat.name}
          </Link>
        ))}
        {sp.category && (
          <Link href={`/store/${tenant}/products`} className="text-sm text-muted-foreground hover:text-[#F8FAFC] transition-colors">
            &times; Clear
          </Link>
        )}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Price:</label>
            <input
              type="number" placeholder="Min" defaultValue={sp.minPrice || ""}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) url.searchParams.set("minPrice", e.target.value);
                else url.searchParams.delete("minPrice");
                url.searchParams.delete("page");
                window.location.href = url.toString();
              }}
              className="w-20 rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-[#F8FAFC] outline-none"
            />
            <span className="text-muted-foreground text-xs">&ndash;</span>
            <input
              type="number" placeholder="Max" defaultValue={sp.maxPrice || ""}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) url.searchParams.set("maxPrice", e.target.value);
                else url.searchParams.delete("maxPrice");
                url.searchParams.delete("page");
                window.location.href = url.toString();
              }}
              className="w-20 rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-[#F8FAFC] outline-none"
            />
          </div>
          <select
            value={sp.sort || ""}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) url.searchParams.set("sort", e.target.value);
              else url.searchParams.delete("sort");
              url.searchParams.delete("page");
              window.location.href = url.toString();
            }}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-[#F8FAFC] outline-none"
          >
            <option value="">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">No products found</p>
          <Link href={`/store/${tenant}/products`} className="mt-4 text-sm font-medium text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p: any) => (
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

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/store/${tenant}/products${qs({ ...Object.fromEntries(Object.entries(sp).filter(([,v]) => v)), page: String(page - 1) })}`}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-[#F8FAFC]"
                >
                  &larr; Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/store/${tenant}/products${qs({ ...Object.fromEntries(Object.entries(sp).filter(([,v]) => v)), page: String(page + 1) })}`}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-[#F8FAFC]"
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
