"use client";

import { useRouter } from "next/navigation";

interface ProductFiltersProps {
  tenant: string;
  category: string | undefined;
  sort: string | undefined;
  minPrice: string | undefined;
  maxPrice: string | undefined;
  categories: Array<{ id: string; name: string }>;
}

export default function ProductFilters({
  tenant,
  category,
  sort,
  minPrice,
  maxPrice,
  categories,
}: ProductFiltersProps) {
  const router = useRouter();

  function buildUrl(params: Record<string, string | undefined>): string {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "") sp.set(k, v);
    });
    if (params.page === "1" || !params.page) sp.delete("page");
    ["category", "sort", "minPrice", "maxPrice"].forEach((key) => {
      if (!sp.has(key) || sp.get(key) === "") sp.delete(key);
    });
    const qs = sp.toString();
    return `/store/${tenant}/products${qs ? `?${qs}` : ""}`;
  }

  const currentParams = { category, sort, minPrice, maxPrice };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={buildUrl({
            ...currentParams,
            category: category === cat.id ? undefined : cat.id,
          })}
          onClick={(e) => {
            e.preventDefault();
            router.push(
              buildUrl({
                ...currentParams,
                category: category === cat.id ? undefined : cat.id,
              }),
            );
          }}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            category === cat.id
              ? "border-[#7C3AED] bg-[#7C3AED]/20 text-[#7C3AED]"
              : "border-border text-muted-foreground hover:border-[#7C3AED]/50 hover:text-[#F8FAFC]"
          }`}
        >
          {cat.name}
        </a>
      ))}
      {category && (
        <a
          href={buildUrl({ sort, minPrice, maxPrice })}
          onClick={(e) => {
            e.preventDefault();
            router.push(buildUrl({ sort, minPrice, maxPrice }));
          }}
          className="text-sm text-muted-foreground hover:text-[#F8FAFC] transition-colors"
        >
          &times; Clear
        </a>
      )}
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Price:</label>
          <input
            type="number"
            placeholder="Min"
            defaultValue={minPrice || ""}
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
            type="number"
            placeholder="Max"
            defaultValue={maxPrice || ""}
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
          value={sort || ""}
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
  );
}
