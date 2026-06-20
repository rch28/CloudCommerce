import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { pageSchema, bannerSchema, type PageInput, type BannerInput } from "@/lib/schemas/cms";

interface PaginateParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const mockPages: Record<string, unknown>[] = [];
const mockSections: Record<string, unknown>[] = [];
const mockBanners: Record<string, unknown>[] = [];

// ── Pages ──────────────────────────────────────────────

export async function getPages(tenantId: string, params: PaginateParams = {}): Promise<PaginatedResult<unknown>> {
  if (process.env.DATABASE_URL) {
    const where: Record<string, unknown> = { tenantId };
    if (params.search) where.title = { contains: params.search };
    if (params.status) where.status = params.status;
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      (prisma as any).page.findMany({
        where,
        include: { sections: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      (prisma as any).page.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
  let items = mockPages.filter((p: Record<string, unknown>) => p.tenantId === tenantId);
  if (params.search) items = items.filter((p: Record<string, unknown>) => String(p.title).toLowerCase().includes(params.search!.toLowerCase()));
  if (params.status) items = items.filter((p: Record<string, unknown>) => p.status === params.status);
  const total = items.length;
  const pg = params.page || 1;
  const ps = params.pageSize || 20;
  return { items: items.slice((pg - 1) * ps, pg * ps), total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) };
}

export async function getPage(id: string): Promise<Record<string, unknown> | null> {
  if (process.env.DATABASE_URL) {
    return (prisma as any).page.findUnique({ where: { id }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
  }
  const page = mockPages.find((p: Record<string, unknown>) => p.id === id);
  if (!page) return null;
  return { ...page, sections: mockSections.filter((s: Record<string, unknown>) => s.pageId === id).sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sortOrder) - Number(b.sortOrder)) };
}

export async function getPageBySlug(slug: string, tenantId: string): Promise<Record<string, unknown> | null> {
  if (process.env.DATABASE_URL) {
    return (prisma as any).page.findUnique({
      where: { slug_tenantId: { slug, tenantId } },
      include: { sections: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
    });
  }
  const page = mockPages.find((p: Record<string, unknown>) => p.slug === slug && p.tenantId === tenantId);
  if (!page) return null;
  return { ...page, sections: mockSections.filter((s: Record<string, unknown>) => s.pageId === page.id && s.isVisible).sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sortOrder) - Number(b.sortOrder)) };
}

export async function createPage(data: PageInput, meta: { tenantId: string; userId?: string }): Promise<Record<string, unknown>> {
  const parsed = pageSchema.parse(data);
  const slug = parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const payload: Record<string, unknown> = {
    title: parsed.title,
    slug,
    type: parsed.type,
    status: parsed.status,
    metaTitle: parsed.metaTitle ?? null,
    metaDescription: parsed.metaDescription ?? null,
    isHomePage: parsed.isHomePage ?? false,
    publishedAt: parsed.status === "published" ? new Date() : null,
    tenantId: meta.tenantId,
  };

  if (process.env.DATABASE_URL) {
    const page = await (prisma as any).page.create({ data: payload });
    if (parsed.sections?.length) {
      await (prisma as any).pageSection.createMany({
        data: parsed.sections.map((s) => ({
          pageId: page.id,
          tenantId: meta.tenantId,
          type: s.type,
          content: s.content,
          styles: s.styles ?? null,
          sortOrder: s.sortOrder,
          isVisible: s.isVisible ?? true,
        })),
      });
    }
    const result = await (prisma as any).page.findUnique({ where: { id: page.id }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
    await logAudit({ entityType: "page", entityId: page.id, action: "created", changes: payload, userId: meta.userId, tenantId: meta.tenantId });
    return result;
  }

  const record = { id: `page-${Date.now()}`, ...payload, createdAt: new Date(), updatedAt: new Date() };
  mockPages.push(record);
  if (parsed.sections?.length) {
    for (const s of parsed.sections) {
      mockSections.push({ id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, pageId: record.id, tenantId: meta.tenantId, type: s.type, content: s.content, styles: s.styles ?? null, sortOrder: s.sortOrder, isVisible: s.isVisible ?? true, createdAt: new Date(), updatedAt: new Date() });
    }
  }
  return { ...record, sections: mockSections.filter((s: Record<string, unknown>) => s.pageId === record.id).sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sortOrder) - Number(b.sortOrder)) };
}

export async function updatePage(id: string, data: Partial<PageInput>, meta: { tenantId: string; userId?: string }): Promise<Record<string, unknown>> {
  const parsed = pageSchema.partial().parse(data);
  const payload: Record<string, unknown> = {};
  if (parsed.title !== undefined) payload.title = parsed.title;
  if (parsed.slug !== undefined) payload.slug = parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (parsed.type !== undefined) payload.type = parsed.type;
  if (parsed.status !== undefined) payload.status = parsed.status;
  if (parsed.metaTitle !== undefined) payload.metaTitle = parsed.metaTitle ?? null;
  if (parsed.metaDescription !== undefined) payload.metaDescription = parsed.metaDescription ?? null;
  if (parsed.isHomePage !== undefined) payload.isHomePage = parsed.isHomePage;
  if (parsed.status === "published") payload.publishedAt = new Date();

  if (process.env.DATABASE_URL) {
    const page = await (prisma as any).page.update({ where: { id }, data: payload });
    if (parsed.sections) {
      await (prisma as any).pageSection.deleteMany({ where: { pageId: id } });
      if (parsed.sections.length) {
        await (prisma as any).pageSection.createMany({
          data: parsed.sections.map((s) => ({
            pageId: id,
            tenantId: meta.tenantId,
            type: s.type,
            content: s.content,
            styles: s.styles ?? null,
            sortOrder: s.sortOrder,
            isVisible: s.isVisible ?? true,
          })),
        });
      }
    }
    const result = await (prisma as any).page.findUnique({ where: { id }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
    await logAudit({ entityType: "page", entityId: id, action: "updated", changes: payload, userId: meta.userId, tenantId: meta.tenantId });
    return result;
  }

  const idx = mockPages.findIndex((p: Record<string, unknown>) => p.id === id);
  if (idx === -1) throw new Error("Page not found");
  Object.assign(mockPages[idx], payload, { updatedAt: new Date() });
  if (parsed.sections) {
    const remaining = mockSections.filter((s: Record<string, unknown>) => s.pageId !== id);
    for (const s of parsed.sections) {
      remaining.push({ id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, pageId: id, tenantId: meta.tenantId, type: s.type, content: s.content, styles: s.styles ?? null, sortOrder: s.sortOrder, isVisible: s.isVisible ?? true, createdAt: new Date(), updatedAt: new Date() });
    }
    mockSections.length = 0;
    mockSections.push(...remaining);
  }
  return { ...mockPages[idx], sections: mockSections.filter((s: Record<string, unknown>) => s.pageId === id).sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sortOrder) - Number(b.sortOrder)) };
}

export async function deletePage(id: string, meta: { tenantId: string; userId?: string }): Promise<void> {
  if (process.env.DATABASE_URL) {
    await (prisma as any).page.delete({ where: { id } });
    await logAudit({ entityType: "page", entityId: id, action: "deleted", userId: meta.userId, tenantId: meta.tenantId });
    return;
  }
  const idx = mockPages.findIndex((p: Record<string, unknown>) => p.id === id);
  if (idx === -1) throw new Error("Page not found");
  mockPages.splice(idx, 1);
  const remaining = mockSections.filter((s: Record<string, unknown>) => s.pageId !== id);
  mockSections.length = 0;
  mockSections.push(...remaining);
}

export async function publishPage(id: string, publish: boolean, meta: { tenantId: string; userId?: string }): Promise<Record<string, unknown>> {
  if (process.env.DATABASE_URL) {
    const page = await (prisma as any).page.update({
      where: { id },
      data: { status: publish ? "published" : "draft", publishedAt: publish ? new Date() : null },
    });
    await logAudit({ entityType: "page", entityId: id, action: publish ? "updated" : "updated", changes: { status: publish ? "published" : "draft" }, userId: meta.userId, tenantId: meta.tenantId });
    return page;
  }
  const idx = mockPages.findIndex((p: Record<string, unknown>) => p.id === id);
  if (idx === -1) throw new Error("Page not found");
  mockPages[idx].status = publish ? "published" : "draft";
  mockPages[idx].publishedAt = publish ? new Date() : null;
  mockPages[idx].updatedAt = new Date();
  return mockPages[idx];
}

// ── Sections ───────────────────────────────────────────

export async function addSection(pageId: string, data: { type: string; content: Record<string, unknown>; styles?: Record<string, unknown>; sortOrder?: number; isVisible?: boolean }, meta: { tenantId: string; userId?: string }): Promise<Record<string, unknown>> {
  const payload = { pageId, tenantId: meta.tenantId, type: data.type, content: data.content, styles: data.styles ?? null, sortOrder: data.sortOrder ?? 0, isVisible: data.isVisible ?? true };
  if (process.env.DATABASE_URL) {
    const section = await (prisma as any).pageSection.create({ data: payload });
    await logAudit({ entityType: "page_section", entityId: section.id, action: "created", userId: meta.userId, tenantId: meta.tenantId });
    return section;
  }
  const record = { id: `sec-${Date.now()}`, ...payload, createdAt: new Date(), updatedAt: new Date() };
  mockSections.push(record);
  return record;
}

export async function updateSection(id: string, data: Partial<{ type: string; content: Record<string, unknown>; styles: Record<string, unknown> | null; sortOrder: number; isVisible: boolean }>, meta: { tenantId: string; userId?: string }): Promise<Record<string, unknown>> {
  if (process.env.DATABASE_URL) {
    const section = await (prisma as any).pageSection.update({ where: { id }, data });
    await logAudit({ entityType: "page_section", entityId: id, action: "updated", userId: meta.userId, tenantId: meta.tenantId });
    return section;
  }
  const idx = mockSections.findIndex((s: Record<string, unknown>) => s.id === id);
  if (idx === -1) throw new Error("Section not found");
  Object.assign(mockSections[idx], data, { updatedAt: new Date() });
  return mockSections[idx];
}

export async function reorderSections(pageId: string, sectionIds: string[], meta: { tenantId: string; userId?: string }): Promise<void> {
  if (process.env.DATABASE_URL) {
    await Promise.all(sectionIds.map((id, idx) => (prisma as any).pageSection.update({ where: { id }, data: { sortOrder: idx } })));
    return;
  }
  const pageSections = mockSections.filter((s: Record<string, unknown>) => s.pageId === pageId);
  for (const s of pageSections) {
    const newIdx = sectionIds.indexOf(String(s.id));
    if (newIdx !== -1) s.sortOrder = newIdx;
  }
}

export async function removeSection(id: string, meta: { tenantId: string; userId?: string }): Promise<void> {
  if (process.env.DATABASE_URL) {
    await (prisma as any).pageSection.delete({ where: { id } });
    await logAudit({ entityType: "page_section", entityId: id, action: "deleted", userId: meta.userId, tenantId: meta.tenantId });
    return;
  }
  const idx = mockSections.findIndex((s: Record<string, unknown>) => s.id === id);
  if (idx !== -1) mockSections.splice(idx, 1);
}

// ── Banners ────────────────────────────────────────────

export async function getBanner(id: string): Promise<Record<string, unknown> | null> {
  if (process.env.DATABASE_URL) {
    return (prisma as any).banner.findUnique({ where: { id } });
  }
  return mockBanners.find((b: Record<string, unknown>) => b.id === id) ?? null;
}

export async function getBanners(tenantId: string, params: PaginateParams = {}): Promise<PaginatedResult<unknown>> {
  if (process.env.DATABASE_URL) {
    const where: Record<string, unknown> = { tenantId };
    if (params.search) where.title = { contains: params.search };
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      (prisma as any).banner.findMany({ where, orderBy: { sortOrder: "asc" }, skip, take: pageSize }),
      (prisma as any).banner.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
  let items = mockBanners.filter((b: Record<string, unknown>) => b.tenantId === tenantId);
  if (params.search) items = items.filter((b: Record<string, unknown>) => String(b.title).toLowerCase().includes(params.search!.toLowerCase()));
  const total = items.length;
  const pg = params.page || 1;
  const ps = params.pageSize || 20;
  return { items: items.slice((pg - 1) * ps, pg * ps), total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) };
}

export async function getActiveBanners(tenantId: string, position?: string): Promise<Record<string, unknown>[]> {
  const now = new Date();
  if (process.env.DATABASE_URL) {
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (position) where.position = position;
    where.OR = [
      { startsAt: null },
      { startsAt: { lte: now } },
    ];
    where.AND = [
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ];
    delete where.OR;
    return (prisma as any).banner.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(position ? { position } : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
  }
  return mockBanners.filter((b: Record<string, unknown>) => {
    if (b.tenantId !== tenantId || !b.isActive) return false;
    if (position && b.position !== position) return false;
    if (b.startsAt && new Date(b.startsAt as string) > now) return false;
    if (b.endsAt && new Date(b.endsAt as string) < now) return false;
    return true;
  }).sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sortOrder) - Number(b.sortOrder));
}

export async function createBanner(data: BannerInput, meta: { tenantId: string; userId?: string }): Promise<Record<string, unknown>> {
  const parsed = bannerSchema.parse(data);
  const payload: Record<string, unknown> = {
    ...parsed,
    subtitle: parsed.subtitle ?? null,
    imageUrl: parsed.imageUrl ?? null,
    linkUrl: parsed.linkUrl ?? null,
    linkText: parsed.linkText ?? null,
    bgColor: parsed.bgColor ?? null,
    textColor: parsed.textColor ?? null,
    startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
    endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
    tenantId: meta.tenantId,
  };

  if (process.env.DATABASE_URL) {
    const banner = await (prisma as any).banner.create({ data: payload });
    await logAudit({ entityType: "banner", entityId: banner.id, action: "created", userId: meta.userId, tenantId: meta.tenantId });
    return banner;
  }
  const record = { id: `banner-${Date.now()}`, ...payload, createdAt: new Date(), updatedAt: new Date() };
  mockBanners.push(record);
  return record;
}

export async function updateBanner(id: string, data: Partial<BannerInput>, meta: { tenantId: string; userId?: string }): Promise<Record<string, unknown>> {
  const parsed = bannerSchema.partial().parse(data);
  const payload: Record<string, unknown> = {};
  if (parsed.title !== undefined) payload.title = parsed.title;
  if (parsed.subtitle !== undefined) payload.subtitle = parsed.subtitle ?? null;
  if (parsed.imageUrl !== undefined) payload.imageUrl = parsed.imageUrl ?? null;
  if (parsed.linkUrl !== undefined) payload.linkUrl = parsed.linkUrl ?? null;
  if (parsed.linkText !== undefined) payload.linkText = parsed.linkText ?? null;
  if (parsed.position !== undefined) payload.position = parsed.position;
  if (parsed.type !== undefined) payload.type = parsed.type;
  if (parsed.bgColor !== undefined) payload.bgColor = parsed.bgColor ?? null;
  if (parsed.textColor !== undefined) payload.textColor = parsed.textColor ?? null;
  if (parsed.isActive !== undefined) payload.isActive = parsed.isActive;
  if (parsed.startsAt !== undefined) payload.startsAt = parsed.startsAt ? new Date(parsed.startsAt) : null;
  if (parsed.endsAt !== undefined) payload.endsAt = parsed.endsAt ? new Date(parsed.endsAt) : null;
  if (parsed.sortOrder !== undefined) payload.sortOrder = parsed.sortOrder;

  if (process.env.DATABASE_URL) {
    const banner = await (prisma as any).banner.update({ where: { id }, data: payload });
    await logAudit({ entityType: "banner", entityId: id, action: "updated", userId: meta.userId, tenantId: meta.tenantId });
    return banner;
  }
  const idx = mockBanners.findIndex((b: Record<string, unknown>) => b.id === id);
  if (idx === -1) throw new Error("Banner not found");
  Object.assign(mockBanners[idx], payload, { updatedAt: new Date() });
  return mockBanners[idx];
}

export async function deleteBanner(id: string, meta: { tenantId: string; userId?: string }): Promise<void> {
  if (process.env.DATABASE_URL) {
    await (prisma as any).banner.delete({ where: { id } });
    await logAudit({ entityType: "banner", entityId: id, action: "deleted", userId: meta.userId, tenantId: meta.tenantId });
    return;
  }
  const idx = mockBanners.findIndex((b: Record<string, unknown>) => b.id === id);
  if (idx === -1) throw new Error("Banner not found");
  mockBanners.splice(idx, 1);
}
