import type { Metadata } from "next";
import Link from "next/link";
import { productRepo } from "@/lib/services/products";
import { categoryRepo } from "@/lib/services/categories";
import { getSettingsBySlug } from "@/lib/services/settings";
import ProductCard from "@/components/storefront/product-card";
import ProductFilters from "@/components/storefront/product-filters";
import EmptyState from "@/components/dashboard/empty-state";
import { TenantIdSetter } from "@/components/storefront/tenant-id-setter";

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
  const store = await getSettingsBySlug(tenant);
  const tenantId = store.tenantId;

  const catResult = await categoryRepo.list(tenantId);
  const categories = catResult.items;

  const productsResult = await productRepo.list(tenantId, {
    status: "active", pageSize: 12,
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(sp.minPrice ? { minPrice: Number(sp.minPrice) } : {}),
    ...(sp.maxPrice ? { maxPrice: Number(sp.maxPrice) } : {}),
    ...(sp.sort ? { sort: sp.sort } : {}),
    ...(sp.page ? { page } : {}),
  });
  const products = productsResult.items;
  const totalPages = productsResult.totalPages;

  const spEntries = Object.fromEntries(Object.entries(sp).filter(([, v]) => v));

  function pageUrl(overrides: Record<string, string | undefined>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...spEntries, ...overrides })) {
      if (v) p.set(k, v);
    }
    if (!p.get("page") || p.get("page") === "1") p.delete("page");
    const q = p.toString();
    return `/store/${tenant}/products${q ? `?${q}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <TenantIdSetter tenantId={tenantId} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Products</h1>
        <p className="mt-1 text-muted-foreground">{productsResult.total} product{productsResult.total !== 1 ? "s" : ""} available</p>
      </div>

      <ProductFilters tenant={tenant} category={sp.category} sort={sp.sort} minPrice={sp.minPrice} maxPrice={sp.maxPrice} categories={categories} />

      {products.length === 0 ? (
        <EmptyState
          message="No products found"
          action={
            <Link href={`/store/${tenant}/products`} className="text-sm font-medium text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
              Clear filters
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={p.variants?.[0]?.price ?? 0}
                image={p.images?.[0]?.url ?? ""}
                stock={p.variants?.[0]?.quantity ?? 0}
                sold={0}
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
                  href={pageUrl({ page: String(page - 1) })}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  &larr; Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={pageUrl({ page: String(page + 1) })}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
