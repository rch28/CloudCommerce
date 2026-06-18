import type { MetadataRoute } from "next";
import { productRepo } from "@/lib/services/products";
import { categoryRepo } from "@/lib/services/categories";

export default async function sitemap({ params }: { params: Promise<{ tenant: string }> }): Promise<MetadataRoute.Sitemap> {
  const { tenant } = await params;
  const base = `/store/${tenant}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const result = await productRepo.list(tenant, { status: "active", pageSize: 1000 });
    productPages = result.items.map((p: any) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {}

  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const result = await categoryRepo.list(tenant);
    categoryPages = result.items.map((c: any) => ({
      url: `${base}/products?category=${c.id}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {}

  return [...staticPages, ...productPages, ...categoryPages];
}
