import { z } from "zod/v4";

// ── Helpers ──────────────────────────────────────────
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z.string().min(1).max(200).regex(slugRe, "Must be a valid slug");

// ── Category ─────────────────────────────────────────
export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: slugField,
  description: z.string().max(500).optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

// ── Product Option ───────────────────────────────────
export const productOptionValueSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).default(0),
});

export const productOptionSchema = z.object({
  name: z.string().min(1, "Option name required").max(100),
  sortOrder: z.number().int().min(0).default(0),
  values: z.array(productOptionValueSchema).default([]),
});

// ── Product Image ────────────────────────────────────
export const productImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  alt: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

// ── Variant ─────────────────────────────────────────
export const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  barcode: z.string().max(50).optional(),
  price: z.number().positive("Price must be positive"),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  quantity: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
});

// ── Product ─────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: slugField,
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  categoryId: z.string().optional(),
  storeId: z.string().optional(),
  images: z.array(productImageSchema).default([]),
  variants: z.array(variantSchema).default([]),
  options: z.array(productOptionSchema).default([]),
});

// ── Inventory ───────────────────────────────────────
export const inventorySchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(0),
  reserved: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  reorderLevel: z.number().int().min(0).default(5),
});

export const stockAdjustSchema = z.object({
  variantId: z.string().min(1),
  change: z.number().int(),
  reason: z.string().min(1).max(500),
});

export const stockReserveSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
  orderId: z.string().optional(),
});

export const stockReleaseSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
  orderId: z.string().optional(),
});

export const variantGenerateSchema = z.object({
  productId: z.string().min(1),
  options: z.array(z.object({
    name: z.string().min(1).max(100),
    values: z.array(z.string().min(1)).min(1),
  })).min(1),
  basePrice: z.number().positive(),
  baseSku: z.string().min(1).max(50),
});

// ── Settings ─────────────────────────────────────────
export const storeInfoSchema = z.object({
  name: z.string().min(1, "Store name is required").max(200),
  logo: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
});

export const contactSchema = z.object({
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal("")),
});

export const addressSettingsSchema = z.object({
  addressCountry: z.string().max(100).optional().or(z.literal("")),
  addressState: z.string().max(100).optional().or(z.literal("")),
  addressCity: z.string().max(100).optional().or(z.literal("")),
  addressZip: z.string().max(20).optional().or(z.literal("")),
});

export const typographySchema = z.object({
  headingFont: z.string().max(100).optional(),
  bodyFont: z.string().max(100).optional(),
});

export const seoSchema = z.object({
  metaTitle: z.string().max(70).optional().or(z.literal("")),
  metaDescription: z.string().max(160).optional().or(z.literal("")),
});

export const domainsSchema = z.object({
  subdomain: z.string().min(1).max(63).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Invalid subdomain"),
  customDomain: z.string().max(253).optional().or(z.literal("")),
});

export const settingsUpdateSchema = z.object({
  storeInfo: storeInfoSchema.optional(),
  branding: brandingSchema.optional(),
  contact: contactSchema.optional(),
  address: addressSettingsSchema.optional(),
  seo: seoSchema.optional(),
  typography: typographySchema.optional(),
  domains: domainsSchema.optional(),
});

export const inviteStaffSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "staff"]).default("staff"),
});

export const updateStaffRoleSchema = z.object({
  staffId: z.string().min(1),
  role: z.enum(["admin", "staff"]),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).default(["read"]),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

// ── Existing schemas (unchanged) ─────────────────────
export const customerSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().optional(),
});

export const addressSchema = z.object({
  label: z.string().default("Home"),
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP is required"),
  country: z.string().default("US"),
  isDefault: z.boolean().default(false),
});

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().positive(),
});

export const orderSchema = z.object({
  customerId: z.string().optional(),
  addressId: z.string().optional(),
  address: addressSchema.optional(),
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
  notes: z.string().optional(),
});

export const planSlugEnum = z.enum(["starter", "growth", "enterprise"]);
export const subscriptionSchema = z.object({
  planSlug: planSlugEnum,
  trialDays: z.number().int().min(0).max(30).optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("usd"),
  provider: z.enum(["stripe", "khalti", "esewa"]),
  description: z.string().optional(),
  returnUrl: z.string().optional(),
});

// ── Type exports ────────────────────────────────────
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductOptionInput = z.infer<typeof productOptionSchema>;
export type ProductOptionValueInput = z.infer<typeof productOptionValueSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
export type StockReserveInput = z.infer<typeof stockReserveSchema>;
export type StockReleaseInput = z.infer<typeof stockReleaseSchema>;
export type VariantGenerateInput = z.infer<typeof variantGenerateSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type StoreInfoInput = z.infer<typeof storeInfoSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AddressSettingsInput = z.infer<typeof addressSettingsSchema>;
export type SeoInput = z.infer<typeof seoSchema>;
export type DomainsInput = z.infer<typeof domainsSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
