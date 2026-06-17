import { prisma } from "@/lib/prisma";
import { variantSchema, type VariantInput } from "@/lib/schemas";

export async function listVariants(productId: string) {
  if (process.env.DATABASE_URL) {
    return prisma.productVariant.findMany({ where: { productId } });
  }
  const { products } = await import("@/data/mock");
  const product = products.find((p) => p.id === productId);
  if (!product) return [];
  return [];
}

export async function createVariant(productId: string, data: VariantInput) {
  const parsed = variantSchema.parse(data);
  if (process.env.DATABASE_URL) {
    return prisma.productVariant.create({
      data: {
        ...parsed,
        comparePrice: parsed.comparePrice,
        attributes: parsed.attributes ? JSON.stringify(parsed.attributes) : null,
        productId,
      },
    });
  }
  return { id: `var-${Date.now()}`, productId, ...parsed, attributes: parsed.attributes ? JSON.stringify(parsed.attributes) : null, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateVariant(id: string, data: Partial<VariantInput>) {
  const parsed = variantSchema.partial().parse(data);
  if (process.env.DATABASE_URL) {
    return prisma.productVariant.update({
      where: { id },
      data: {
        ...parsed,
        comparePrice: parsed.comparePrice,
        attributes: parsed.attributes ? JSON.stringify(parsed.attributes) : null,
      },
    });
  }
  return { id, ...parsed };
}

export async function deleteVariant(id: string) {
  if (process.env.DATABASE_URL) {
    return prisma.productVariant.delete({ where: { id } });
  }
  return { id };
}
