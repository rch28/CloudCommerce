import { z } from "zod/v4";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(100).regex(slugRe, "Must be a valid slug"),
  description: z.string().max(500).optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
});

export const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  price: z.number().positive("Price must be positive"),
  comparePrice: z.number().positive().optional(),
  quantity: z.number().int().min(0).default(0),
  attributes: z.record(z.string(), z.string()).optional(),
  isDefault: z.boolean().default(false),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1).max(200).regex(slugRe, "Must be a valid slug"),
  description: z.string().max(5000).optional(),
  images: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  variants: z.array(variantSchema).default([]),
});

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

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
