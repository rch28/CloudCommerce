import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productRepo } from "@/lib/services/products";
import { getSettingsBySlug } from "@/lib/services/settings";
import { PRODUCT_DETAIL_REVALIDATE } from "@/lib/storefront";
import { getInventory } from "@/lib/services/inventory";
import ProductDetailClient from "./client";

export const revalidate = PRODUCT_DETAIL_REVALIDATE;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ tenant: string; slug: string }> }): Promise<Metadata> {
  const { tenant, slug } = await params;
  const product = await productRepo.getBySlug(slug, tenant);
  if (!product) return { title: "Product Not Found" };
  const store = await getSettingsBySlug(tenant).catch(() => null);
  const name = store?.name || tenant.charAt(0).toUpperCase() + tenant.slice(1);
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.shortDescription || product.description?.slice(0, 160);
  const ogImage = product.images?.[0]?.url;
  return {
    title: `${title} | ${name}`,
    description,
    openGraph: {
      title, description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title, description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `/store/${tenant}/products/${slug}` },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ tenant: string; slug: string }> }) {
  const { tenant, slug } = await params;
  const product = await productRepo.getBySlug(slug, tenant);
  if (!product) notFound();

  const variants = (product as any).variants || [];
  const inventoryResults = await Promise.allSettled(
    variants.map((v: any) => getInventory(v.id).catch(() => null))
  );
  const entries = inventoryResults
    .filter((r) => r.status === "fulfilled" && r.value != null)
    .map((r) => [(r as PromiseFulfilledResult<any>).value.variantId, { quantity: (r as PromiseFulfilledResult<any>).value.quantity, reserved: (r as PromiseFulfilledResult<any>).value.reserved }] as const);
  const inventoryMap: Record<string, { quantity: number; reserved: number }> = Object.fromEntries(entries);

  const serialized = JSON.parse(JSON.stringify(product));

  return <ProductDetailClient tenant={tenant} product={serialized} inventoryMap={inventoryMap} />;
}
