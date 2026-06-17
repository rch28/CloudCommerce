import { notFound } from "next/navigation";
import { productRepo } from "@/lib/services/products";
import ProductDetailClient from "./client";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ tenant: string; slug: string }> }) {
  const { tenant, slug } = await params;
  const product = await productRepo.getBySlug(slug, tenant);

  if (!product) notFound();

  const serialized = JSON.parse(JSON.stringify(product));

  return <ProductDetailClient tenant={tenant} product={serialized} />;
}
