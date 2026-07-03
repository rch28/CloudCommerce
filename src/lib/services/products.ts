import { prisma } from "@/lib/prisma";
import { BaseRepository, type AuditMeta, type PaginateParams, type PaginatedResult } from "@/lib/repository";
import { productSchema, type ProductInput } from "@/lib/schemas";
import { generateSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";
import { productCache } from "@/lib/redis";
import { withCache, invalidateProductCache, invalidateStorefrontCache, invalidateSearchCache } from "@/lib/cache";

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
  protected modelName = "product";

  async list(tenantId: string, params: PaginateParams & { search?: string; categoryId?: string; status?: string; sort?: string; minPrice?: number; maxPrice?: number } = {}): Promise<PaginatedResult<ProductRecord>> {
    if (process.env.DATABASE_URL) {
      const where: Record<string, unknown> = { tenantId, deletedAt: null };
      if (params.search) where.name = { contains: params.search };
      if (params.categoryId) where.categoryId = params.categoryId;
      if (params.status) where.status = params.status;
      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        const priceFilter: Record<string, unknown> = {};
        if (params.minPrice !== undefined) priceFilter.gte = params.minPrice;
        if (params.maxPrice !== undefined) priceFilter.lte = params.maxPrice;
        (where as any).variants = { some: { price: priceFilter } };
      }

      const sortMap: Record<string, { field: string; dir: "asc" | "desc" }> = {
        name: { field: "name", dir: "asc" },
        newest: { field: "createdAt", dir: "desc" },
        price_asc: { field: "price", dir: "asc" },
        price_desc: { field: "price", dir: "desc" },
      };

      const isPriceSort = params.sort === "price_asc" || params.sort === "price_desc" || params.orderBy === "price";

      let orderBy: Record<string, "asc" | "desc"> | undefined = { createdAt: "desc" };
      if (!isPriceSort && params.sort && sortMap[params.sort]) {
        const s = sortMap[params.sort];
        orderBy = { [s.field]: s.dir };
      } else if (!isPriceSort && params.orderBy) {
        orderBy = { [params.orderBy]: params.order || "desc" };
      } else if (isPriceSort) {
        orderBy = undefined;
      }

      const page = Math.max(1, params.page || 1);
      const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
      const skip = (page - 1) * pageSize;
        const [items, total] = await Promise.all([
          prisma.product.findMany({
            where,
            include: buildIncludes(),
            orderBy,
            skip: isPriceSort ? undefined : skip,
            take: isPriceSort ? undefined : pageSize,
          }),
          prisma.product.count({ where }),
        ]);

      let result = items as unknown as ProductRecord[];
      const priceDir = params.sort === "price_desc" ? "desc" : params.orderBy === "price" ? (params.order || "asc") : null;
      if (priceDir === "asc") {
        result.sort((a, b) => (a.variants?.[0]?.price ?? 0) - (b.variants?.[0]?.price ?? 0));
      } else if (priceDir === "desc") {
        result.sort((a, b) => (b.variants?.[0]?.price ?? 0) - (a.variants?.[0]?.price ?? 0));
      }
      const sliced = result.slice(skip, skip + pageSize);
      return { items: sliced, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
    let items = mockProducts.filter((p) => p.tenantId === tenantId && !p.deletedAt).map(inflateMock);
    if (params.search) items = items.filter((p) => p.name.toLowerCase().includes(params.search!.toLowerCase()));
    if (params.categoryId) items = items.filter((p) => p.categoryId === params.categoryId);
    if (params.status) items = items.filter((p) => p.status === params.status);
    if (params.minPrice !== undefined) items = items.filter((p) => (p.variants?.[0]?.price ?? 0) >= params.minPrice!);
    if (params.maxPrice !== undefined) items = items.filter((p) => (p.variants?.[0]?.price ?? 0) <= params.maxPrice!);
    if (params.sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
    else if (params.sort === "newest") items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (params.sort === "price_asc") items.sort((a, b) => (a.variants?.[0]?.price ?? 0) - (b.variants?.[0]?.price ?? 0));
    else if (params.sort === "price_desc") items.sort((a, b) => (b.variants?.[0]?.price ?? 0) - (a.variants?.[0]?.price ?? 0));
    const total = items.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getById(id: string, tenantId?: string): Promise<ProductRecord | null> {
    if (process.env.DATABASE_URL) {
      return withCache(
        async () => {
          const where: Record<string, unknown> = { id, deletedAt: null };
          if (tenantId) where.tenantId = tenantId;
          const record = await prisma.product.findFirst({ where, include: buildIncludes() });
          return record as unknown as ProductRecord | null;
        },
        { get: (key: string) => productCache.get(key, tenantId), set: (data) => productCache.set(data, (data as Record<string, unknown>).tenantId as string | undefined) },
        id,
        tenantId,
      );
    }
    const record = mockProducts.find((p) => p.id === id && !p.deletedAt && (!tenantId || p.tenantId === tenantId));
    return record ? inflateMock(record) : null;
  }

  async getBySlug(slug: string, tenantId: string): Promise<ProductRecord | null> {
    if (process.env.DATABASE_URL) {
      return withCache(
        async () => {
          const record = await prisma.product.findFirst({ where: { slug, tenantId, deletedAt: null }, include: buildIncludes() });
          return record as unknown as ProductRecord | null;
        },
        { get: (key: string) => productCache.get(key, tenantId), set: (data) => productCache.set(data, tenantId) },
        slug,
        tenantId,
      );
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
          status: parsed.status, categoryId: parsed.categoryId || null,
          storeId: parsed.storeId || null, createdById: meta.userId ?? null,
          images: { create: parsed.images.filter((img) => img.url).map((img, i) => ({ url: img.url, alt: img.alt ?? null, sortOrder: img.sortOrder || i })) },
          options: { create: parsed.options.map((o, oi) => ({ name: o.name, sortOrder: o.sortOrder || oi, values: { create: o.values.map((ov, vi) => ({ label: ov.label, value: ov.value, sortOrder: ov.sortOrder || vi })) } })) },
        },
        include: {
          images: { orderBy: { sortOrder: "asc" as const } },
          options: { include: { values: { orderBy: { sortOrder: "asc" as const } } }, orderBy: { sortOrder: "asc" as const } },
        },
      });

      // Create variants separately to avoid potential Prisma nested-create Int issues
      const createdVariants = parsed.variants.length > 0
        ? (await Promise.all(
            parsed.variants.map((v) =>
              prisma.productVariant.create({
                data: {
                  productId: record.id, sku: v.sku, barcode: v.barcode ?? null, price: v.price,
                  comparePrice: v.comparePrice ?? null, costPrice: v.costPrice ?? null,
                  weight: v.weight ?? null, quantity: v.quantity,
                  isDefault: v.isDefault, status: v.status,
                },
              }),
            ),
          )) as unknown as VariantRecord[]
        : [];

      let category = null;
      if (parsed.categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: parsed.categoryId }, select: { id: true, name: true, slug: true } });
        if (cat) category = cat;
      }

      const result: ProductRecord = {
        ...record as unknown as ProductRecord,
        variants: createdVariants,
        category,
      };

      await logAuditFn("created", record.id, parsed, meta);
      invalidateStorefrontCache(meta.tenantId);
      invalidateSearchCache(meta.tenantId);
      return result;
    }

    const id = `prod-${Date.now()}`;
    const record: ProductRecord = { id, tenantId: meta.tenantId, storeId: parsed.storeId || null, categoryId: parsed.categoryId || null, name: parsed.name, slug, description: parsed.description ?? null, shortDescription: parsed.shortDescription ?? null, seoTitle: parsed.seoTitle ?? null, seoDescription: parsed.seoDescription ?? null, status: parsed.status, createdById: meta.userId ?? null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    mockProducts.push(record);
    parsed.images.filter((img) => img.url).forEach((img, i) => mockImages.push({ id: `img-${i}`, productId: id, url: img.url, alt: img.alt ?? null, sortOrder: img.sortOrder || i, createdAt: new Date() }));
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
      const { images: _imgs, variants: updateVariants, options: _opts, ...fields } = parsed;
      // Verify ownership before mutating.
      const existing = await prisma.product.findFirst({ where: { id, tenantId: meta.tenantId } });
      if (!existing) throw new Error("Product not found or access denied");
      const record = await prisma.product.update({ where: { id }, data: fields as any });

      // Update variants when provided (fixes quantity-not-saving bug)
      if (updateVariants && updateVariants.length > 0) {
        const existing = await prisma.productVariant.findMany({
          where: { productId: id, deletedAt: null },
          orderBy: { createdAt: "asc" },
        });
        for (let i = 0; i < updateVariants.length; i++) {
          const v = updateVariants[i];
          const existingId = v.id || existing[i]?.id;
          if (existingId) {
            await prisma.productVariant.update({
              where: { id: existingId },
              data: {
                sku: v.sku, barcode: v.barcode ?? null, price: v.price,
                comparePrice: v.comparePrice ?? null, costPrice: v.costPrice ?? null,
                weight: v.weight ?? null, quantity: v.quantity,
                isDefault: v.isDefault, status: v.status,
              },
            });
          }
        }
      }

      const complete = await prisma.product.findFirst({
        where: { id },
        include: buildIncludes(),
      });
      if (!complete) throw new Error("Product not found after update");

      await logAuditFn("updated", id, fields, meta);
      invalidateProductCache(id, meta.tenantId);
      invalidateStorefrontCache(meta.tenantId);
      invalidateSearchCache(meta.tenantId);
      return complete as unknown as ProductRecord;
    }
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    Object.assign(mockProducts[idx], parsed, { slug: parsed.slug ? generateSlug(parsed.slug) : mockProducts[idx].slug, updatedAt: new Date() });
    return inflateMock(mockProducts[idx]);
  }

  async remove(id: string, meta: AuditMeta): Promise<ProductRecord> {
    if (process.env.DATABASE_URL) {
      const existing = await prisma.product.findFirst({ where: { id, tenantId: meta.tenantId } });
      if (!existing) throw new Error("Product not found or access denied");
      const record = await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
      await logAuditFn("deleted", id, { softDelete: true }, meta);
      invalidateProductCache(id, meta.tenantId);
      invalidateStorefrontCache(meta.tenantId);
      invalidateSearchCache(meta.tenantId);
      return record as unknown as ProductRecord;
    }
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx].deletedAt = new Date();
    return inflateMock(mockProducts[idx]);
  }

  async archive(id: string, meta: AuditMeta): Promise<ProductRecord> {
    if (process.env.DATABASE_URL) {
      const existing = await prisma.product.findFirst({ where: { id, tenantId: meta.tenantId } });
      if (!existing) throw new Error("Product not found or access denied");
      const record = await prisma.product.update({ where: { id }, data: { status: "archived" }, include: buildIncludes() });
      await logAuditFn("updated", id, { status: "archived" }, meta);
      invalidateProductCache(id, meta.tenantId);
      invalidateStorefrontCache(meta.tenantId);
      invalidateSearchCache(meta.tenantId);
      return record as unknown as ProductRecord;
    }
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx].status = "archived";
    return inflateMock(mockProducts[idx]);
  }

  async restore(id: string, meta: AuditMeta): Promise<ProductRecord> {
    if (process.env.DATABASE_URL) {
      const existing = await prisma.product.findFirst({ where: { id, tenantId: meta.tenantId, deletedAt: { not: null } } });
      if (!existing) throw new Error("Product not found or access denied");
      const record = await prisma.product.update({ where: { id }, data: { deletedAt: null, status: "active" }, include: buildIncludes() });
      await logAuditFn("updated", id, { deletedAt: null, status: "active" }, meta);
      invalidateProductCache(id, meta.tenantId);
      invalidateStorefrontCache(meta.tenantId);
      invalidateSearchCache(meta.tenantId);
      return record as unknown as ProductRecord;
    }
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx].deletedAt = null;
    mockProducts[idx].status = "active";
    return inflateMock(mockProducts[idx]);
  }

  async duplicate(id: string, meta: AuditMeta): Promise<ProductRecord> {
    const original = await this.getById(id);
    if (!original) throw new Error("Product not found");

    const dupInput: ProductInput = {
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      description: original.description ?? undefined,
      shortDescription: original.shortDescription ?? undefined,
      seoTitle: original.seoTitle ?? undefined,
      seoDescription: original.seoDescription ?? undefined,
      status: "draft",
      categoryId: original.categoryId ?? undefined,
      storeId: original.storeId ?? undefined,
      images: (original.images ?? []).map((img) => ({ url: img.url, alt: img.alt ?? undefined, sortOrder: img.sortOrder })),
      variants: (original.variants ?? []).map((v) => ({
        sku: `${v.sku}-copy`,
        barcode: v.barcode ?? undefined,
        price: v.price,
        comparePrice: v.comparePrice ?? undefined,
        costPrice: v.costPrice ?? undefined,
        weight: v.weight ?? undefined,
        quantity: 0,
        isDefault: v.isDefault,
        status: "inactive",
      })),
      options: (original.options ?? []).map((o) => ({
        name: o.name,
        sortOrder: o.sortOrder,
        values: (o as any).values?.map((ov: Record<string, unknown>) => ({ label: ov.label as string, value: ov.value as string, sortOrder: ov.sortOrder as number })) ?? [],
      })),
    };

    return this.createOne(dupInput, meta);
  }

  async bulkArchive(ids: string[], meta: AuditMeta): Promise<number> {
    let count = 0;
    for (const id of ids) { try { await this.archive(id, meta); count++; } catch { /* skip */ } }
    return count;
  }

  async bulkDelete(ids: string[], meta: AuditMeta): Promise<number> {
    let count = 0;
    for (const id of ids) { try { await this.remove(id, meta); count++; } catch { /* skip */ } }
    return count;
  }
}

async function logAuditFn(action: string, entityId: string, changes: unknown, meta: AuditMeta) {
  await logAudit({ entityType: "product", entityId, action: action as any, changes: changes as Record<string, unknown>, userId: meta.userId, tenantId: meta.tenantId });
}

export const productRepo = new ProductRepository();
