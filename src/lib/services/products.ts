import { prisma } from "@/lib/prisma";
import { productSchema, type ProductInput } from "@/lib/schemas";
import { products as mockData, type Product as MockProduct } from "@/data/mock";

const mockProducts = [...mockData];
type MockVariant = {
  id: string; productId: string; sku: string; price: number;
  comparePrice: number | null; quantity: number; attributes: string | null;
  isDefault: boolean; createdAt: Date; updatedAt: Date;
};
const mockVariants: Record<string, MockVariant[]> = {};

mockProducts.forEach((p, i) => {
  mockVariants[p.id] = [{
    id: `var-${i}`, productId: p.id, sku: `SKU-${p.id}`,
    price: p.price, comparePrice: null, quantity: p.stock,
    attributes: JSON.stringify({ colors: p.variants }),
    isDefault: true, createdAt: new Date(), updatedAt: new Date(),
  }];
});

interface ProductFilters {
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

function filterMock(search?: string, category?: string, status?: string) {
  let result = [...mockProducts];
  if (search) result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  if (category) result = result.filter((p) => p.category === category);
  if (status) result = result.filter((p) => p.status === status);
  return result;
}

function sortMock(result: typeof mockProducts, sort?: string, order?: "asc" | "desc") {
  const mul = order === "asc" ? 1 : -1;
  if (sort === "name") return result.sort((a, b) => a.name.localeCompare(b.name) * mul);
  if (sort === "price") return result.sort((a, b) => (a.price - b.price) * mul);
  if (sort === "stock") return result.sort((a, b) => (a.stock - b.stock) * mul);
  return result;
}

export async function listProducts(tenantId: string, filters: ProductFilters = {}) {
  const { search, category, status, sort, order, page = 1, pageSize = 10 } = filters;

  if (process.env.DATABASE_URL) {
    const where: Record<string, unknown> = { tenantId };
    if (search) where.name = { contains: search };
    if (category) where.categoryId = category;
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { variants: true, category: true },
        orderBy: sort ? { [sort]: order || "desc" } : { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  let result = filterMock(search, category, status);
  const total = result.length;
  result = sortMock(result, sort, order);
  const items = result.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getProduct(id: string) {
  if (process.env.DATABASE_URL) {
    return prisma.product.findUnique({ where: { id }, include: { variants: true, category: true } });
  }
  const product = mockProducts.find((p) => p.id === id);
  if (!product) return null;
  return { ...product, variants: mockVariants[product.id] || [], category: null };
}

export async function createProduct(data: ProductInput, tenantId: string, userId?: string) {
  const parsed = productSchema.parse(data);
  if (process.env.DATABASE_URL) {
    return prisma.product.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description ?? null,
        images: parsed.images,
        categoryId: parsed.categoryId ?? null,
        status: parsed.status,
        tenantId,
        createdById: userId ?? null,
        variants: {
          create: parsed.variants.map((v) => ({
            sku: v.sku,
            price: v.price,
            comparePrice: v.comparePrice ?? null,
            quantity: v.quantity,
            attributes: v.attributes ? JSON.stringify(v.attributes) : null,
            isDefault: v.isDefault,
          })),
        },
      },
      include: { variants: true },
    });
  }
  const id = `P-${Date.now()}`;
  const product: MockProduct = {
    id, name: parsed.name, category: "", price: parsed.variants[0]?.price || 0,
    stock: parsed.variants[0]?.quantity || 0, image: parsed.images[0] || "",
    status: parsed.status as MockProduct["status"], sold: 0, variants: [],
  };
  mockProducts.unshift(product);
  mockVariants[id] = parsed.variants.map((v, i) => ({
    id: `var-${id}-${i}`, productId: id, sku: v.sku, price: v.price,
    comparePrice: v.comparePrice ?? null, quantity: v.quantity,
    attributes: v.attributes ? JSON.stringify(v.attributes) : null,
    isDefault: v.isDefault, createdAt: new Date(), updatedAt: new Date(),
  }));
  return { ...product, variants: mockVariants[id] };
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  const parsed = productSchema.partial().parse(data);
  if (process.env.DATABASE_URL) {
    const { variants: _vs, ...rest } = parsed;
    return prisma.product.update({
      where: { id },
      data: {
        ...rest,
        description: rest.description ?? null,
        categoryId: rest.categoryId ?? null,
      },
      include: { variants: true },
    });
  }
  const idx = mockProducts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Product not found");
  const existing = mockProducts[idx];
  mockProducts[idx] = {
    ...existing, ...parsed,
    image: parsed.images?.[0] ?? existing.image,
    price: parsed.variants?.[0]?.price ?? existing.price,
    stock: parsed.variants?.[0]?.quantity ?? existing.stock,
    category: parsed.categoryId ?? existing.category,
    variants: parsed.variants?.map((v) => v.sku) ?? existing.variants,
  };
  return { ...mockProducts[idx], variants: mockVariants[id] || [] };
}

export async function archiveProduct(id: string) {
  if (process.env.DATABASE_URL) {
    return prisma.product.update({ where: { id }, data: { status: "archived" } });
  }
  const idx = mockProducts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Product not found");
  mockProducts[idx].status = "archived" as MockProduct["status"];
  return mockProducts[idx];
}

export async function deleteProduct(id: string) {
  if (process.env.DATABASE_URL) {
    return prisma.product.delete({ where: { id } });
  }
  const idx = mockProducts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Product not found");
  mockProducts.splice(idx, 1);
  delete mockVariants[id];
  return { id };
}
