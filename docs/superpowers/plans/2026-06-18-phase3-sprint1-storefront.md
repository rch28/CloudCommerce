# Phase 3 Sprint 1 — Storefront Architecture Implementation Plan

> **For agentic workers:** Build production-ready customer-facing storefront. All pages exist in scaffold form — this plan elevates them to production quality.

**Goal:** Production-ready multi-tenant storefront with ISR, image optimization, SEO, sitemap, and brand theming.

**Architecture:** The storefront lives at `(storefront)/store/[tenant]/` as a Next.js App Router route group. Each page is a Server Component with `revalidate` for ISR. Client components handle interactivity (cart, variant selection). CSS variables from store settings control branding.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Prisma, Next/Image, Zod.

---

### Task 1: Settings — Add typography fields + inject brand CSS variables

**Files:**
- Modify: `prisma/schema.prisma` (add headingFont, bodyFont to Store)
- Modify: `src/lib/schemas.ts` (add typographySchema)
- Modify: `src/lib/services/settings.ts` (add typography to store record)
- Modify: `src/app/(storefront)/store/[tenant]/layout.tsx` (inject CSS vars)

- [ ] **Step 1: Add typography fields to Prisma Store model**

Add after `secondaryColor` in `prisma/schema.prisma`:
```prisma
headingFont   String   @default("Inter")
bodyFont      String   @default("Inter")
```

- [ ] **Step 2: Add typographySchema to lib/schemas.ts**

After `brandingSchema`, add:
```ts
export const typographySchema = z.object({
  headingFont: z.string().max(100).optional(),
  bodyFont: z.string().max(100).optional(),
});
```

Add to `settingsUpdateSchema`:
```ts
typography: typographySchema.optional(),
```

- [ ] **Step 3: Add typography to StoreRecord in settings.ts**

Add to `StoreRecord`:
```ts
headingFont: string; bodyFont: string;
```

Add defaults in `defaultStore()`:
```ts
headingFont: "Inter", bodyFont: "Inter",
```

Add handling in `updateSettings()` for `typography`.

- [ ] **Step 4: Inject brand CSS variables in tenant layout**

In `(storefront)/store/[tenant]/layout.tsx`, wrap the return with a `<div>` that has inline `style` setting CSS variables:
```tsx
<div style={{
  "--brand-primary": store?.primaryColor || "#7C3AED",
  "--brand-secondary": store?.secondaryColor || "#8B5CF6",
  "--brand-heading-font": store?.headingFont || "Inter",
  "--brand-body-font": store?.bodyFont || "Inter",
} as React.CSSProperties}>
```

- [ ] **Step 5: Run typecheck**

### Task 2: Add `generateStaticParams` for ISR pre-generation

**Files:**
- Modify: `src/app/(storefront)/store/[tenant]/page.tsx`
- Modify: `src/app/(storefront)/store/[tenant]/products/page.tsx`
- Modify: `src/app/(storefront)/store/[tenant]/products/[slug]/page.tsx`
- Modify: `src/app/(storefront)/store/[tenant]/categories/page.tsx`

- [ ] **Step 1: Add generateStaticParams to home page**

```ts
export async function generateStaticParams() {
  return []; // ISR on-demand — tenants are dynamic
}
```

- [ ] **Step 2: Add generateStaticParams to products page**

```ts
export async function generateStaticParams() {
  return []; // on-demand via ISR
}
```

- [ ] **Step 3: Add generateStaticParams to product detail page**

```ts
export async function generateStaticParams() {
  return []; // on-demand via ISR
}
```

- [ ] **Step 4: Add generateStaticParams to categories page**

```ts
export async function generateStaticParams() {
  return []; // on-demand via ISR
}
```

---

### Task 3: Replace all `<img>` with Next.js `Image`

**Files:**
- Modify: `src/components/storefront/header.tsx`
- Modify: `src/components/storefront/footer.tsx`
- Modify: `src/components/storefront/product-card.tsx`
- Modify: `src/app/(storefront)/store/[tenant]/products/[slug]/client.tsx`

- [ ] **Step 1: Add CloudFront remotePattern to next.config.ts**

```ts
remotePatterns: [
  { protocol: "https", hostname: "d64gsuwffb70l.cloudfront.net" },
  { protocol: "https", hostname: "**.stripe.com" },
  { protocol: "https", hostname: "**.cloudfront.net" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "via.placeholder.com" },
],
```

- [ ] **Step 2: Replace img in header.tsx logo**

```tsx
import Image from "next/image";
// ...
<Image src={logo} alt={storeName} className="h-8 w-8 rounded-lg object-cover" width={32} height={32} />
```

- [ ] **Step 3: Replace img in footer.tsx logo**

Same pattern.

- [ ] **Step 4: Replace img in product-card.tsx**

```tsx
<Image src={image} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
```

- [ ] **Step 5: Replace img in product detail client.tsx**

Main image:
```tsx
<Image src={images[selectedImage]} alt={product.name} className="h-full w-full object-cover" fill sizes="(max-width: 1024px) 100vw, 50vw" priority />
```

Thumbnails:
```tsx
<Image src={img} alt="" className="h-full w-full object-cover" fill sizes="64px" />
```

---

### Task 4: Add server-side sorting to productRepo

**Files:**
- Modify: `src/lib/services/products.ts` (add sort params to list query)
- Modify: `src/app/(storefront)/store/[tenant]/products/page.tsx` (use server sort)

- [ ] **Step 1: Add sort field mapping to productRepo.list()**

In the list method, add sort field mapping before the DB query:
```ts
const sortMap: Record<string, string> = {
  price_asc: "variants.price",
  price_desc: "variants.price",
  newest: "createdAt",
  name: "name",
};
```

For simplicity, since Prisma can't sort by relation field directly in all cases, use:
```ts
if (params.sort === "name") params.orderBy = "name"; params.order = "asc";
else if (params.sort === "newest") params.orderBy = "createdAt"; params.order = "desc";
```

For price sorting, keep in-memory (it requires joining variants).

- [ ] **Step 2: Update products page to pass sort params to repo**

```ts
const productsResult = await productRepo.list(tenant, {
  status: "active", pageSize: 100,
  ...(sp.category ? { categoryId: sp.category } : {}),
  ...(sp.sort ? { sort: sp.sort } : {}),
});
```

- [ ] **Step 3: Remove in-memory sort block from products page**

Remove the `if (sp.sort === "price_asc") ...` block since it's now in the repo.

---

### Task 5: Fix search page to use real search adapter

**Files:**
- Modify: `src/app/(storefront)/store/[tenant]/search/page.tsx`

- [ ] **Step 1: Import search service directly, remove mock products loading**

```ts
const result = await searchService.searchProducts({
  query,
  page,
  pageSize: 12,
  filters: { status: "active" },
});
```

Remove the `setMockProducts` call and `allProducts` loading.

---

### Task 6: Create dynamic sitemap

**Files:**
- Create: `src/app/(storefront)/store/[tenant]/sitemap.ts`

- [ ] **Step 1: Create sitemap generator**

```ts
import type { MetadataRoute } from "next";
import { productRepo } from "@/lib/services/products";
import { categoryRepo } from "@/lib/services/categories";

export default async function sitemap({ params }: { params: Promise<{ tenant: string }> }): Promise<MetadataRoute.Sitemap> {
  const { tenant } = await params;
  const base = `/store/${tenant}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  let products: any[] = [];
  try {
    const result = await productRepo.list(tenant, { status: "active", pageSize: 1000 });
    products = result.items;
  } catch {}

  let categories: any[] = [];
  try {
    const result = await categoryRepo.list(tenant);
    categories = result.items;
  } catch {}

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updatedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/products?category=${c.id}`,
    lastModified: c.updatedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
```

---

### Task 7: Add loading and error states

**Files:**
- Create: `src/app/(storefront)/store/[tenant]/loading.tsx`
- Create: `src/app/(storefront)/store/[tenant]/error.tsx`
- Create: `src/app/(storefront)/store/[tenant]/products/loading.tsx`
- Create: `src/app/(storefront)/store/[tenant]/products/[slug]/loading.tsx`
- Create: `src/app/(storefront)/store/[tenant]/categories/loading.tsx`
- Create: `src/app/(storefront)/store/[tenant]/search/loading.tsx`

- [ ] **Step 1: Create loading skeletons for each route**

Simple centered spinner for each.

---

### Task 8: Apply brand CSS variables across all storefront pages

**Files:**
- Modify: all page files in `(storefront)/store/[tenant]/`

- [ ] **Step 1: Update references to hardcoded #7C3AED colors**

Replace `#7C3AED` with `var(--brand-primary)` via inline styles or className.
Use Tailwind classes that reference the CSS variables where possible.

---

## Implementation Notes

- All ISR revalidation values are pre-configured in `src/lib/storefront.ts`
- The search service selects the adapter automatically based on env vars
- Image optimization uses Next.js built-in sharp pipeline
- Sitemap auto-discovers all products and categories for each tenant
- CSS variables cascade from tenant layout to all child pages
