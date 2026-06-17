import { listProducts } from "@/lib/services/products";
import { listCategories } from "@/lib/services/categories";
import ProductCard from "@/components/storefront/product-card";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  params, searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ search?: string; category?: string; sort?: string }>;
}) {
  const { tenant } = await params;
  const sp = await searchParams;
  const productsResult = await listProducts(tenant);
  const products = Array.isArray(productsResult) ? productsResult : productsResult.items;
  const categories = await listCategories(tenant);

  let filtered = [...products].filter((p: any) => !p.archivedAt);

  if (sp.search) {
    const q = sp.search.toLowerCase();
    filtered = filtered.filter((p: any) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
  }
  if (sp.category) {
    filtered = filtered.filter((p: any) => p.categoryId === sp.category);
  }
  if (sp.sort === "price_asc") filtered.sort((a: any, b: any) => (a.variants?.[0]?.price ?? 0) - (b.variants?.[0]?.price ?? 0));
  else if (sp.sort === "price_desc") filtered.sort((a: any, b: any) => (b.variants?.[0]?.price ?? 0) - (a.variants?.[0]?.price ?? 0));
  else if (sp.sort === "newest") filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (sp.sort === "name") filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F8FAFC]">Products</h1>
        <p className="mt-1 text-muted-foreground">{filtered.length} product{filtered.length !== 1 ? "s" : ""} available</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        {categories.map((cat: any) => (
          <a
            key={cat.id}
            href={`/store/${tenant}/products${sp.category === cat.id ? "" : `?category=${cat.id}`}`}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              sp.category === cat.id
                ? "border-[#7C3AED] bg-[#7C3AED]/20 text-[#7C3AED]"
                : "border-border text-muted-foreground hover:border-[#7C3AED]/50 hover:text-[#F8FAFC]"
            }`}
          >
            {cat.name}
          </a>
        ))}
        {sp.category && (
          <a href={`/store/${tenant}/products`} className="text-sm text-muted-foreground hover:text-[#F8FAFC] transition-colors">
            &times; Clear
          </a>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Sort:</label>
          <select
            value={sp.sort || ""}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) url.searchParams.set("sort", e.target.value);
              else url.searchParams.delete("sort");
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">No products found</p>
          <a href={`/store/${tenant}/products`} className="mt-4 text-sm font-medium text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
            Clear filters
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p: any) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.variants?.[0]?.price ?? 0}
              image={p.images?.[0] ?? ""}
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
  );
}
