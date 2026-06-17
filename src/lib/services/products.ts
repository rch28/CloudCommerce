import { prisma } from "@/lib/prisma";
import { BaseRepository, type AuditMeta, type PaginateParams, type PaginatedResult } from "@/lib/repository";
import { productSchema, type ProductInput } from "@/lib/schemas";
import { generateSlug } from "@/lib/slug";

interface ImageRecord {
  id: string; productId: string; url: string; alt: string | null; sortOrder: number; createdAt: Date;
}

interface VariantRecord {
  id: string; productId: string; sku: string; barcode: string | null;
  price: number; comparePrice: number | null; costPrice: number | null;
  weight: number | null; quantity: number; isDefault: boolean;
  status: string; deletedAt: Date | null; createdAt: Date; updatedAt: Date;
}

interface OptionRecord {
  id: string; productId: string; name: string; sortOrder: number; createdAt: Date;
}

interface OptionValueRecord {
  id: string; optionId: string; variantId: string | null; label: string; value: string; sortOrder: number;
}

interface ProductRecord {
  id: string; tenantId: string; storeId: string | null; categoryId: string | null;
  name: string; slug: string; description: string | null; shortDescription: string | null;
  seoTitle: string | null; seoDescription: string | null; status: string;
  createdById: string | null; deletedAt: Date | null; createdAt: Date; updatedAt: Date;
  images?: ImageRecord[]; variants?: VariantRecord[]; options?: OptionRecord[];
  category?: { id: string; name: string; slug: string } | null;
}

const mockProducts: ProductRecord[] = [];
const mockImages: ImageRecord[] = [];
const mockVariants: VariantRecord[] = [];
const mockOptions: OptionRecord[] = [];
const mockOptionValues: OptionValueRecord[] = [];

function buildIncludes() {
  return {
    images: { orderBy: { sortOrder: "asc" as const } },
    variants: { where: { deletedAt: null }, orderBy: { createdAt: "asc" as const } },
    options: { include: { values: { orderBy: { sortOrder: "asc" as const } } }, orderBy: { sortOrder: "asc" as const } },
    category: { select: { id: true, name: true, slug: true } },
  };
}

function inflateMock(record: ProductRecord): ProductRecord {
  return {
    ...record,
    images: mockImages.filter((i) => i.productId === record.id).sort((a, b) => a.sortOrder - b.sortOrder),
    variants: mockVariants.filter((v) => v.productId === record.id && !v.deletedAt),
    options: mockOptions.filter((o) => o.productId === record.id).sort((a, b) => a.sortOrder - b.sortOrder).map((o) => ({
      ...o,
      values: mockOptionValues.filter((ov) => ov.optionId === o.id).sort((a, b) => a.sortOrder - b.sortOrder),
    })),
  };
}

class ProductRepository extends BaseRepository<ProductRecord, ProductInput, Partial<ProductInput>> {
  protected entityType = "product" as const;
  protected model = prisma.product;

  async list(tenantId: string, params: PaginateParams & { search?: string; categoryId?: string; status?: string } = {}): Promise<PaginatedResult<ProductRecord>> {
    if (process.env.DATABASE_URL) {
      const where: Record<string, unknown> = { tenantId, deletedAt: null };
      if (params.search) where.name = { contains: params.search };
      if (params.categoryId) where.categoryId = params.categoryId;
      if (params.status) where.status = params.status;
      const page = Math.max(1, params.page || 1);
      const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
      const skip = (page - 1) * pageSize;
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: buildIncludes(),
          orderBy: params.orderBy ? { [params.orderBy]: params.order || "desc" } : { createdAt: "desc" },
          skip, take: pageSize,
        }),
        prisma.product.count({ where }),
      ]);
      return { items: items as unknown as ProductRecord[], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
    let items = mockProducts.filter((p) => p.tenantId === tenantId && !p.deletedAt).map(inflateMock);
    if (params.search) items = items.filter((p) => p.name.toLowerCase().includes(params.search!.toLowerCase()));
    if (params.categoryId) items = items.filter((p) => p.categoryId === params.categoryId);
    if (params.status) items = items.filter((p) => p.status === params.status);
    const total = items.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getById(id: string): Promise<ProductRecord | null> {
    if (process.env.DATABASE_URL) {
      const record = await prisma.product.findFirst({ where: { id, deletedAt: null }, include: buildIncludes() });
      return record as unknown as ProductRecord | null;
    }
    const record = mockProducts.find((p) => p.id === id && !p.deletedAt);
    return record ? inflateMock(record) : null;
  }

  async getBySlug(slug: string, tenantId: string): Promise<ProductRecord | null> {
    if (process.env.DATABASE_URL) {
      const record = await prisma.product.findFirst({ where: { slug, tenantId, deletedAt: null }, include: buildIncludes() });
      return record as unknown as ProductRecord | null;
    }
    const record = mockProducts.find((p) => p.slug === slug && p.tenantId === tenantId && !p.deletedAt);
    return record ? inflateMock(record) : null;
  }

  async createOne(data: ProductInput, meta: AuditMeta): Promise<ProductRecord> {
    const parsed = productSchema.parse(data);
    const slug = generateSlug(parsed.slug);

    if (process.env.DATABASE_URL) {
      const record = await prisma.product.create({
        data: {
          name: parsed.name, slug, tenantId: meta.tenantId,
          description: parsed.description ?? null, shortDescription: parsed.shortDescription ?? null,
          seoTitle: parsed.seoTitle ?? null, seoDescription: parsed.seoDescription ?? null,
          status: parsed.status, categoryId: parsed.categoryId ?? null,
          storeId: parsed.storeId ?? null, createdById: meta.userId ?? null,
          images: { create: parsed.images.map((img, i) => ({ url: img.url, alt: img.alt ?? null, sortOrder: img.sortOrder || i })) },
          variants: { create: parsed.variants.map((v) => ({ sku: v.sku, barcode: v.barcode ?? null, price: v.price, comparePrice: v.comparePrice ?? null, costPrice: v.costPrice ?? null, weight: v.weight ?? null, quantity: v.quantity, isDefault: v.isDefault, status: v.status })) },
          options: { create: parsed.options.map((o, oi) => ({ name: o.name, sortOrder: o.sortOrder || oi, values: { create: o.values.map((ov, vi) => ({ label: ov.label, value: ov.value, sortOrder: ov.sortOrder || vi })) } })) },
        },
        include: buildIncludes(),
      });
      await logAuditFn("created", record.id, parsed, meta);
      return record as unknown as ProductRecord;
    }

    const id = `prod-${Date.now()}`;
    const record: ProductRecord = { id, tenantId: meta.tenantId, storeId: parsed.storeId ?? null, categoryId: parsed.categoryId ?? null, name: parsed.name, slug, description: parsed.description ?? null, shortDescription: parsed.shortDescription ?? null, seoTitle: parsed.seoTitle ?? null, seoDescription: parsed.seoDescription ?? null, status: parsed.status, createdById: meta.userId ?? null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    mockProducts.push(record);
    parsed.images.forEach((img, i) => mockImages.push({ id: `img-${i}`, productId: id, url: img.url, alt: img.alt ?? null, sortOrder: img.sortOrder || i, createdAt: new Date() }));
    parsed.variants.forEach((v, i) => mockVariants.push({ id: `var-${i}`, productId: id, sku: v.sku, barcode: v.barcode ?? null, price: v.price, comparePrice: v.comparePrice ?? null, costPrice: v.costPrice ?? null, weight: v.weight ?? null, quantity: v.quantity, isDefault: v.isDefault, status: v.status, deletedAt: null, createdAt: new Date(), updatedAt: new Date() }));
    parsed.options.forEach((o, oi) => {
      const optId = `opt-${oi}`;
      mockOptions.push({ id: optId, productId: id, name: o.name, sortOrder: o.sortOrder || oi, createdAt: new Date() });
      o.values.forEach((ov, vi) => mockOptionValues.push({ id: `ov-${vi}`, optionId: optId, variantId: null, label: ov.label, value: ov.value, sortOrder: ov.sortOrder || vi }));
    });
    return inflateMock(record);
  }

  async updateOne(id: string, data: Partial<ProductInput>, meta: AuditMeta): Promise<ProductRecord> {
    const parsed = productSchema.partial().parse(data);
    if (process.env.DATABASE_URL) {
      const { images: _imgs, variants: _vars, options: _opts, ...fields } = parsed;
      const record = await prisma.product.update({ where: { id }, data: fields as any, include: buildIncludes() });
      await logAuditFn("updated", id, fields, meta);
      return record as unknown as ProductRecord;
    }
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    Object.assign(mockProducts[idx], parsed, { slug: parsed.slug ? generateSlug(parsed.slug) : mockProducts[idx].slug, updatedAt: new Date() });
    return inflateMock(mockProducts[idx]);
  }

  async remove(id: string, meta: AuditMeta): Promise<ProductRecord> {
    if (process.env.DATABASE_URL) {
      const record = await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
      await logAuditFn("deleted", id, { softDelete: true }, meta);
      return record as unknown as ProductRecord;
    }
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx].deletedAt = new Date();
    return inflateMock(mockProducts[idx]);
  }

  async archive(id: string, meta: AuditMeta): Promise<ProductRecord> {
    if (process.env.DATABASE_URL) {
      const record = await prisma.product.update({ where: { id }, data: { status: "archived" }, include: buildIncludes() });
      await logAuditFn("updated", id, { status: "archived" }, meta);
      return record as unknown as ProductRecord;
    }
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx].status = "archived";
    return inflateMock(mockProducts[idx]);
  }
}

async function logAuditFn(action: string, entityId: string, changes: any, meta: AuditMeta) {
  const { logAudit } = await import("@/lib/audit");
  await logAudit({ entityType: "product", entityId, action: action as any, changes, userId: meta.userId, tenantId: meta.tenantId });
}

export const productRepo = new ProductRepository();
