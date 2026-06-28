import { prisma } from "@/lib/prisma";
import { BaseRepository, type AuditMeta, type PaginatedResult } from "@/lib/repository";
import { variantSchema, type VariantInput } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

interface VariantRecord {
  id: string; productId: string; sku: string; barcode: string | null;
  price: number; comparePrice: number | null; costPrice: number | null;
  weight: number | null; quantity: number; isDefault: boolean;
  status: string; deletedAt: Date | null; createdAt: Date; updatedAt: Date;
}

const mockVariants: VariantRecord[] = [];

class VariantRepository extends BaseRepository<VariantRecord, VariantInput, Partial<VariantInput>> {
  protected entityType = "variant" as const;
  protected modelName = "productVariant";

  async listByProduct(productId: string): Promise<VariantRecord[]> {
    if (process.env.DATABASE_URL) {
      return prisma.productVariant.findMany({ where: { productId, deletedAt: null }, orderBy: { createdAt: "asc" } }) as unknown as VariantRecord[];
    }
    return mockVariants.filter((v) => v.productId === productId && !v.deletedAt);
  }

  async getById(id: string, tenantId?: string): Promise<VariantRecord | null> {
    if (process.env.DATABASE_URL) {
      // Scope via the parent product's tenantId to prevent cross-tenant IDOR.
      const where: Record<string, unknown> = { id, deletedAt: null };
      if (tenantId) where.product = { tenantId };
      return prisma.productVariant.findFirst({ where } as any) as unknown as VariantRecord | null;
    }
    return mockVariants.find((v) => v.id === id && !v.deletedAt) ?? null;
  }

  async createOne(productId: string, data: VariantInput, meta: AuditMeta): Promise<VariantRecord> {
    const parsed = variantSchema.parse(data);
    if (process.env.DATABASE_URL) {
      const record = await prisma.productVariant.create({
        data: { ...parsed, barcode: parsed.barcode ?? null, comparePrice: parsed.comparePrice ?? null, costPrice: parsed.costPrice ?? null, weight: parsed.weight ?? null, productId },
      });
      await logAudit({ entityType: "variant", entityId: record.id, action: "created", changes: parsed, userId: meta.userId, tenantId: meta.tenantId });
      return record as unknown as VariantRecord;
    }
    const record: VariantRecord = { id: `var-${Date.now()}`, productId, ...parsed, barcode: parsed.barcode ?? null, comparePrice: parsed.comparePrice ?? null, costPrice: parsed.costPrice ?? null, weight: parsed.weight ?? null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    mockVariants.push(record);
    return record;
  }

  async updateOne(id: string, data: Partial<VariantInput>, meta: AuditMeta): Promise<VariantRecord> {
    const parsed = variantSchema.partial().parse(data);
    if (process.env.DATABASE_URL) {
      const existing = await prisma.productVariant.findFirst({ where: { id, product: { tenantId: meta.tenantId } } } as any);
      if (!existing) throw new Error("Variant not found or access denied");
      const record = await prisma.productVariant.update({ where: { id }, data: parsed });
      await logAudit({ entityType: "variant", entityId: id, action: "updated", changes: parsed, userId: meta.userId, tenantId: meta.tenantId });
      return record as unknown as VariantRecord;
    }
    const idx = mockVariants.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error("Variant not found");
    Object.assign(mockVariants[idx], parsed, { updatedAt: new Date() });
    return mockVariants[idx];
  }

  async remove(id: string, meta: AuditMeta): Promise<VariantRecord> {
    if (process.env.DATABASE_URL) {
      const existing = await prisma.productVariant.findFirst({ where: { id, product: { tenantId: meta.tenantId } } } as any);
      if (!existing) throw new Error("Variant not found or access denied");
      const record = await prisma.productVariant.update({ where: { id }, data: { deletedAt: new Date() } });
      await logAudit({ entityType: "variant", entityId: id, action: "deleted", changes: { softDelete: true }, userId: meta.userId, tenantId: meta.tenantId });
      return record as unknown as VariantRecord;
    }
    const idx = mockVariants.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error("Variant not found");
    mockVariants[idx].deletedAt = new Date();
    return mockVariants[idx];
  }
}

export const variantRepo = new VariantRepository();
