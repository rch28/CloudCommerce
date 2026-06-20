import { BaseRepository, type AuditMeta, type PaginateParams, type PaginatedResult } from "@/lib/repository";
import { categorySchema, type CategoryInput } from "@/lib/schemas";
import { generateSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";
import { withCache, invalidateCategoryCache, invalidateStorefrontCache } from "@/lib/cache";
import { categoryCache } from "@/lib/redis";

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
  protected modelName = "category";

  async list(tenantId: string, params: PaginateParams & { search?: string; status?: string } = {}): Promise<PaginatedResult<CategoryRecord>> {
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
    if (process.env.DATABASE_URL) {
      return withCache(
        () => this.findById(id),
        { get: (key: string) => categoryCache.get(key), set: (data) => categoryCache.set(data, (data as Record<string, unknown>).tenantId as string | undefined) },
        id,
      );
    }
    return mockCategories.find((c) => c.id === id && !c.deletedAt) ?? null;
  }

  async createOne(data: CategoryInput, meta: AuditMeta): Promise<CategoryRecord> {
    const parsed = categorySchema.parse(data);
    const slug = generateSlug(parsed.slug);
    const { status: _, parentId, ...rest } = parsed;
    if (process.env.DATABASE_URL) {
      const payload: Record<string, unknown> = {
        ...rest, slug,
        description: parsed.description ?? null,
        image: parsed.image ?? null,
        tenantId: meta.tenantId,
        parent: parentId ? { connect: { id: parentId } } : undefined,
      };
      invalidateStorefrontCache(meta.tenantId);
      return this.create(payload as CategoryInput, meta);
    }
    const payload = { ...parsed, slug, description: parsed.description ?? null, image: parsed.image ?? null, parentId: parsed.parentId ?? null, tenantId: meta.tenantId };
    const record: CategoryRecord = { id: `cat-${Date.now()}`, ...payload, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    mockCategories.push(record);
    return record;
  }

  async updateOne(id: string, data: Partial<CategoryInput>, meta: AuditMeta): Promise<CategoryRecord> {
    const parsed = categorySchema.partial().parse(data);
    const slug = parsed.slug ? generateSlug(parsed.slug) : undefined;
    const { status: _, ...rest } = parsed;
    if (process.env.DATABASE_URL) {
      const payload: Record<string, unknown> = { ...rest, slug };
      if (parsed.description !== undefined) payload.description = parsed.description ?? null;
      if (parsed.image !== undefined) payload.image = parsed.image ?? null;
      if (parsed.parentId !== undefined) {
        delete payload.parentId;
        payload.parent = parsed.parentId ? { connect: { id: parsed.parentId } } : { disconnect: true };
      }
      invalidateCategoryCache(id, meta.tenantId);
      invalidateStorefrontCache(meta.tenantId);
      return this.update(id, payload as Partial<CategoryInput>, meta);
    }
    const payload: Record<string, unknown> = { ...parsed, slug };
    if (parsed.description !== undefined) payload.description = parsed.description ?? null;
    if (parsed.image !== undefined) payload.image = parsed.image ?? null;
    if (parsed.parentId !== undefined) payload.parentId = parsed.parentId ?? null;
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    Object.assign(mockCategories[idx], payload, { updatedAt: new Date() });
    return mockCategories[idx];
  }

  async remove(id: string, meta: AuditMeta): Promise<CategoryRecord> {
    if (process.env.DATABASE_URL) {
      invalidateCategoryCache(id, meta.tenantId);
      invalidateStorefrontCache(meta.tenantId);
      return this.softDelete(id, meta);
    }
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    mockCategories[idx].deletedAt = new Date();
    return mockCategories[idx];
  }

  async archive(id: string, meta: AuditMeta): Promise<CategoryRecord> {
    if (process.env.DATABASE_URL) {
      invalidateCategoryCache(id, meta.tenantId);
      invalidateStorefrontCache(meta.tenantId);
      const record = await this.model.update({ where: { id }, data: { deletedAt: new Date() } });
      await logAudit({ entityType: "category", entityId: id, action: "archived", changes: { deletedAt: new Date().toISOString() }, userId: meta.userId, tenantId: meta.tenantId });
      return record as CategoryRecord;
    }
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    mockCategories[idx].deletedAt = new Date();
    return mockCategories[idx];
  }

  async restore(id: string, meta: AuditMeta): Promise<CategoryRecord> {
    if (process.env.DATABASE_URL) {
      invalidateCategoryCache(id, meta.tenantId);
      invalidateStorefrontCache(meta.tenantId);
      const record = await this.model.update({ where: { id }, data: { deletedAt: null } });
      await logAudit({ entityType: "category", entityId: id, action: "updated", changes: { deletedAt: null }, userId: meta.userId, tenantId: meta.tenantId });
      return record as CategoryRecord;
    }
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    mockCategories[idx].deletedAt = null;
    return mockCategories[idx];
  }

  async bulkArchive(ids: string[], meta: AuditMeta): Promise<number> {
    let count = 0;
    for (const id of ids) {
      try { await this.archive(id, meta); count++; } catch { /* skip */ }
    }
    return count;
  }

  async bulkDelete(ids: string[], meta: AuditMeta): Promise<number> {
    let count = 0;
    for (const id of ids) {
      try { await this.remove(id, meta); count++; } catch { /* skip */ }
    }
    return count;
  }
}

export const categoryRepo = new CategoryRepository();
