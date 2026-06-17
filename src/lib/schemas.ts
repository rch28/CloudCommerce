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
  lowStockThreshold: z.number().int().min(0).default(10),
  reorderLevel: z.number().int().min(0).default(5),
});

export const stockAdjustSchema = z.object({
  variantId: z.string().min(1),
  change: z.number().int(),
  reason: z.string().min(1).max(500),
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
export type CustomerInput = z.infer<typeof customerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
