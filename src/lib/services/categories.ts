import { prisma } from "@/lib/prisma";
import { categorySchema, type CategoryInput } from "@/lib/schemas";
const mockCategories = [
  { id: "cat-1", name: "Audio", slug: "audio", description: "Audio equipment", image: null, parentId: null, tenantId: "t-1", createdAt: new Date(), updatedAt: new Date() },
  { id: "cat-2", name: "Wearables", slug: "wearables", description: "Wearable devices", image: null, parentId: null, tenantId: "t-1", createdAt: new Date(), updatedAt: new Date() },
  { id: "cat-3", name: "Accessories", slug: "accessories", description: "Accessories", image: null, parentId: null, tenantId: "t-1", createdAt: new Date(), updatedAt: new Date() },
];

export async function listCategories(tenantId: string, search?: string) {
  if (process.env.DATABASE_URL) {
    return prisma.category.findMany({
      where: { tenantId, ...(search ? { name: { contains: search } } : {}) },
      orderBy: { name: "asc" },
    });
  }
  let result = mockCategories.filter((c) => c.tenantId === tenantId);
  if (search) result = result.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  return result;
}

export async function getCategory(id: string) {
  if (process.env.DATABASE_URL) {
    return prisma.category.findUnique({ where: { id } });
  }
  return mockCategories.find((c) => c.id === id) ?? null;
}

export async function createCategory(data: CategoryInput, tenantId: string) {
  const parsed = categorySchema.parse(data);
  if (process.env.DATABASE_URL) {
    return prisma.category.create({ data: { ...parsed, tenantId } });
  }
  const cat = { id: `cat-${Date.now()}`, ...parsed, image: parsed.image ?? null, parentId: parsed.parentId ?? null, tenantId, createdAt: new Date(), updatedAt: new Date() };
  mockCategories.push(cat as typeof mockCategories[0]);
  return cat;
}

export async function updateCategory(id: string, data: Partial<CategoryInput>) {
  const parsed = categorySchema.partial().parse(data);
  if (process.env.DATABASE_URL) {
    return prisma.category.update({ where: { id }, data: parsed });
  }
  const idx = mockCategories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Category not found");
  Object.assign(mockCategories[idx], parsed, { updatedAt: new Date() });
  return mockCategories[idx];
}

export async function deleteCategory(id: string) {
  if (process.env.DATABASE_URL) {
    return prisma.category.delete({ where: { id } });
  }
  const idx = mockCategories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Category not found");
  mockCategories.splice(idx, 1);
  return { id };
}
