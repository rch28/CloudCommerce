import { notFound } from "next/navigation";
import { listProducts } from "@/lib/services/products";
import ProductDetailClient from "./client";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ tenant: string; slug: string }> }) {
  const { tenant, slug } = await params;
  const productsResult = await listProducts(tenant);
  const products = Array.isArray(productsResult) ? productsResult : productsResult.items;
  const product = products.find((p: any) => p.slug === slug && !p.archivedAt);

  if (!product) notFound();

  const serialized = JSON.parse(JSON.stringify(product));

  return <ProductDetailClient tenant={tenant} product={serialized} />;
}
