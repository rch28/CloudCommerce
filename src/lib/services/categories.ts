import { prisma } from "@/lib/prisma";
import { BaseRepository, type AuditMeta, type PaginateParams, type PaginatedResult } from "@/lib/repository";
import { categorySchema, type CategoryInput } from "@/lib/schemas";
import { generateSlug } from "@/lib/slug";

interface CategoryRecord {
  id: string; name: string; slug: string; description: string | null;
  image: string | null; parentId: string | null; tenantId: string;
  deletedAt: Date | null; createdAt: Date; updatedAt: Date;
}

const mockCategories: CategoryRecord[] = [
  { id: "cat-1", name: "Audio", slug: "audio", description: "Audio equipment", image: null, parentId: null, tenantId: "t-1", deletedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "cat-2", name: "Wearables", slug: "wearables", description: "Wearable devices", image: null, parentId: null, tenantId: "t-1", deletedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "cat-3", name: "Accessories", slug: "accessories", description: "Accessories", image: null, parentId: null, tenantId: "t-1", deletedAt: null, createdAt: new Date(), updatedAt: new Date() },
];

class CategoryRepository extends BaseRepository<CategoryRecord, CategoryInput, Partial<CategoryInput>> {
  protected entityType = "category" as const;
  protected model = prisma.category;

  async list(tenantId: string, params: PaginateParams & { search?: string } = {}): Promise<PaginatedResult<CategoryRecord>> {
    if (process.env.DATABASE_URL) {
      const where: Record<string, unknown> = { tenantId, deletedAt: null };
      if (params.search) where.name = { contains: params.search };
      return this.findMany(where, params);
    }
    let items = mockCategories.filter((c) => c.tenantId === tenantId && !c.deletedAt);
    if (params.search) items = items.filter((c) => c.name.toLowerCase().includes(params.search!.toLowerCase()));
    const total = items.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getById(id: string): Promise<CategoryRecord | null> {
    if (process.env.DATABASE_URL) return this.findById(id);
    return mockCategories.find((c) => c.id === id && !c.deletedAt) ?? null;
  }

  async createOne(data: CategoryInput, meta: AuditMeta): Promise<CategoryRecord> {
    const parsed = categorySchema.parse(data);
    const payload = { ...parsed, image: parsed.image ?? null, parentId: parsed.parentId ?? null, tenantId: meta.tenantId };
    if (process.env.DATABASE_URL) return this.create(payload as CategoryInput, meta);
    const record: CategoryRecord = { id: `cat-${Date.now()}`, ...payload, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    mockCategories.push(record);
    return record;
  }

  async updateOne(id: string, data: Partial<CategoryInput>, meta: AuditMeta): Promise<CategoryRecord> {
    const parsed = categorySchema.partial().parse(data);
    if (process.env.DATABASE_URL) return this.update(id, parsed, meta);
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    Object.assign(mockCategories[idx], parsed, { updatedAt: new Date() });
    return mockCategories[idx];
  }

  async remove(id: string, meta: AuditMeta): Promise<CategoryRecord> {
    if (process.env.DATABASE_URL) return this.softDelete(id, meta);
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    mockCategories[idx].deletedAt = new Date();
    return mockCategories[idx];
  }
}

export const categoryRepo = new CategoryRepository();
