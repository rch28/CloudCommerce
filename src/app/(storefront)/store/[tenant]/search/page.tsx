import type { Metadata } from "next";
import Link from "next/link";
import { searchService } from "@/lib/services/search";
import { getSettingsBySlug } from "@/lib/services/settings";
import { STOREFRONT_REVALIDATE } from "@/lib/storefront";
import ProductCard from "@/components/storefront/product-card";

export const revalidate = STOREFRONT_REVALIDATE;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { tenant } = await params;
  const sp = await searchParams;
  const store = await getSettingsBySlug(tenant).catch(() => null);
  const name = store?.name || tenant.charAt(0).toUpperCase() + tenant.slice(1);
  const query = sp.q || "";
  return {
    title: query ? `Search: "${query}"` : "Search",
    description: `Search results for "${query}" at ${name}.`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  params, searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { tenant } = await params;
  const sp = await searchParams;
  const query = (sp.q || "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Search</h1>
        <p className="mt-2 text-muted-foreground">Enter a search term to find products.</p>
      </div>
    );
  }

  const result = await searchService.searchProducts({ query, page, pageSize: 12, filters: { status: "active" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F8FAFC]">
          Search results for &ldquo;{query}&rdquo;
        </h1>
        <p className="mt-1 text-muted-foreground">{result.total} result{result.total !== 1 ? "s" : ""}</p>
      </div>

      {result.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">No products found for &ldquo;{query}&rdquo;</p>
          <Link href={`/store/${tenant}/products`} className="mt-4 text-sm font-medium text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
            Browse all products
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {result.items.map((p: any) => (
              <ProductCard
                key={p.id} id={p.id} name={p.name} slug={p.slug}
                price={p.variants?.[0]?.price ?? 0}
                image={p.images?.[0]?.url ?? ""}
                stock={p.variants?.[0]?.quantity ?? 0}
                sold={p.sold ?? 0} tenant={tenant}
                category={p.category?.name ?? "General"}
                variantId={p.variants?.[0]?.id}
              />
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/store/${tenant}/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-[#F8FAFC]"
                >
                  &larr; Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {result.totalPages}
              </span>
              {page < result.totalPages && (
                <Link
                  href={`/store/${tenant}/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
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
