import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { storeInfoSchema, brandingSchema, typographySchema, contactSchema, addressSettingsSchema, seoSchema, domainsSchema, settingsUpdateSchema } from "@/lib/schemas";

export type { StoreRecord };

interface StoreRecord {
  id: string; tenantId: string; name: string; slug: string;
  description: string | null; logo: string | null;
  primaryColor: string; secondaryColor: string;
  headingFont: string; bodyFont: string;
  contactEmail: string | null; contactPhone: string | null;
  addressCountry: string | null; addressState: string | null;
  addressCity: string | null; addressZip: string | null;
  metaTitle: string | null; metaDescription: string | null;
  subdomain: string; customDomain: string | null;
}

const mockStore: Record<string, StoreRecord> = {};

function defaultStore(tenantId: string): StoreRecord {
  return {
    id: `store-${tenantId}`, tenantId, name: "My Store", slug: "my-store",
    description: null, logo: null, primaryColor: "#7C3AED", secondaryColor: "#8B5CF6",
    headingFont: "Inter", bodyFont: "Inter",
    contactEmail: null, contactPhone: null,
    addressCountry: null, addressState: null, addressCity: null, addressZip: null,
    metaTitle: null, metaDescription: null, subdomain: `${tenantId}-store`, customDomain: null,
  };
}

export async function getSettingsBySlug(slug: string): Promise<StoreRecord> {
  if (process.env.DATABASE_URL) {
    const store = await (prisma as any).store.findFirst({ where: { slug } });
    if (!store) return defaultStore(slug);
    return store as StoreRecord;
  }
  const entry = Object.values(mockStore).find((s) => s.slug === slug || s.subdomain === slug);
  return entry ?? defaultStore(slug);
}

export async function getSettings(tenantId: string): Promise<StoreRecord> {
  if (process.env.DATABASE_URL) {
    let store = await (prisma as any).store.findFirst({ where: { tenantId } });
    if (!store) {
      store = await (prisma as any).store.create({
        data: { tenantId, name: "My Store", slug: `store-${tenantId}`, subdomain: `${tenantId}-store` },
      });
    }
    return store as unknown as StoreRecord;
  }
  if (!mockStore[tenantId]) mockStore[tenantId] = defaultStore(tenantId);
  return { ...mockStore[tenantId] };
}

export async function updateSettings(tenantId: string, data: Record<string, unknown>, userId?: string): Promise<StoreRecord> {
  const parsed = settingsUpdateSchema.parse(data);

  if (process.env.DATABASE_URL) {
    const updateData: Record<string, unknown> = {};
    if (parsed.storeInfo) {
      const info = storeInfoSchema.parse(parsed.storeInfo);
      Object.assign(updateData, info);
    }
    if (parsed.branding) {
      const brand = brandingSchema.parse(parsed.branding);
      Object.assign(updateData, brand);
    }
    if (parsed.contact) {
      const contact = contactSchema.parse(parsed.contact);
      Object.assign(updateData, { contactEmail: contact.contactEmail || null, contactPhone: contact.contactPhone || null });
    }
    if (parsed.address) {
      const addr = addressSettingsSchema.parse(parsed.address);
      Object.assign(updateData, {
        addressCountry: addr.addressCountry || null,
        addressState: addr.addressState || null,
        addressCity: addr.addressCity || null,
        addressZip: addr.addressZip || null,
      });
    }
    if (parsed.seo) {
      const seo = seoSchema.parse(parsed.seo);
      Object.assign(updateData, { metaTitle: seo.metaTitle || null, metaDescription: seo.metaDescription || null });
    }
    if (parsed.typography) {
      const typo = typographySchema.parse(parsed.typography);
      if (typo.headingFont) updateData.headingFont = typo.headingFont;
      if (typo.bodyFont) updateData.bodyFont = typo.bodyFont;
    }

    if (parsed.domains) {
      const domain = domainsSchema.parse(parsed.domains);
      Object.assign(updateData, domain);
    }

    const existing = await (prisma as any).store.findFirst({ where: { tenantId } });
    if (!existing) throw new Error("Store not found");
    const store = await (prisma as any).store.update({ where: { id: existing.id }, data: updateData });
    await logAudit({ entityType: "settings", entityId: store.id, action: "updated", changes: updateData, userId, tenantId });
    return store as unknown as StoreRecord;
  }

  const existing = mockStore[tenantId] ?? defaultStore(tenantId);

  if (parsed.storeInfo) {
    const info = storeInfoSchema.parse(parsed.storeInfo);
    Object.assign(existing, info);
  }
  if (parsed.branding) {
    const brand = brandingSchema.parse(parsed.branding);
    Object.assign(existing, brand);
  }
  if (parsed.contact) {
    const contact = contactSchema.parse(parsed.contact);
    Object.assign(existing, { contactEmail: contact.contactEmail || null, contactPhone: contact.contactPhone || null });
  }
  if (parsed.address) {
    const addr = addressSettingsSchema.parse(parsed.address);
    Object.assign(existing, {
      addressCountry: addr.addressCountry || null,
      addressState: addr.addressState || null,
      addressCity: addr.addressCity || null,
      addressZip: addr.addressZip || null,
    });
  }
  if (parsed.seo) {
    const seo = seoSchema.parse(parsed.seo);
    Object.assign(existing, { metaTitle: seo.metaTitle || null, metaDescription: seo.metaDescription || null });
  }
  if (parsed.typography) {
    const typo = typographySchema.parse(parsed.typography);
    if (typo.headingFont) existing.headingFont = typo.headingFont;
    if (typo.bodyFont) existing.bodyFont = typo.bodyFont;
  }

  if (parsed.domains) {
    const domain = domainsSchema.parse(parsed.domains);
    Object.assign(existing, domain);
  }

  mockStore[tenantId] = { ...existing };
  await logAudit({ entityType: "settings", entityId: mockStore[tenantId].id, action: "updated", changes: data, userId, tenantId });
  return { ...mockStore[tenantId] };
}
