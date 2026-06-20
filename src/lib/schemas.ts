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

export const customerRegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
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

export const checkoutSchema = z.object({
  addressId: z.string().optional(),
  address: addressSchema.optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.addressId || data.address,
  { message: "Either addressId or address is required" },
);

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
export type CheckoutInput = z.infer<typeof checkoutSchema>;
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
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ── Discount Engine ──────────────────────────────────
export const couponSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  type: z.enum(["fixed", "percentage", "free_shipping"]),
  value: z.coerce.number().positive(),
  maxDiscount: z.coerce.number().positive().optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  appliesTo: z.enum(["all", "products", "categories", "customers"]).default("all"),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  customerIds: z.array(z.string()).default([]),
  firstOrderOnly: z.boolean().default(false),
  startsAt: z.union([z.string().datetime(), z.date()]),
  expiresAt: z.union([z.string().datetime(), z.date()]).optional(),
  isActive: z.boolean().default(true),
});

export type CouponInput = z.infer<typeof couponSchema>;

export const promotionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["automatic", "cart_rule"]).default("automatic"),
  priority: z.coerce.number().int().default(0),
  discountType: z.enum(["fixed", "percentage", "free_shipping"]),
  discountValue: z.coerce.number().positive(),
  maxDiscount: z.coerce.number().positive().optional(),
  startsAt: z.union([z.string().datetime(), z.date()]),
  expiresAt: z.union([z.string().datetime(), z.date()]).optional(),
  isActive: z.boolean().default(true),
  rules: z.array(z.object({
    type: z.enum(["min_amount", "product", "category", "customer", "first_order"]),
    value: z.string(),
  })).default([]),
});

export type PromotionInput = z.infer<typeof promotionSchema>;

export const couponValidateSchema = z.object({
  code: z.string().min(1),
  tenantId: z.string().min(1),
  subtotal: z.coerce.number().min(0),
  shipping: z.coerce.number().min(0).default(0),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  customerId: z.string().optional(),
  isFirstOrder: z.boolean().default(false),
});

export type CouponValidateInput = z.infer<typeof couponValidateSchema>;

// ── Reviews & Ratings ────────────────────────────────
export const reviewImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  alt: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export type ReviewImageInput = z.infer<typeof reviewImageSchema>;

export const reviewSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  orderItemId: z.string().min(1, "Order item is required"),
  rating: z.coerce.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  images: z.array(reviewImageSchema).default([]),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const reviewUpdateSchema = reviewSchema.partial().omit({ productId: true, orderItemId: true });

export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;

export const moderationSchema = z.object({
  status: z.enum(["approved", "hidden"]),
  reason: z.string().optional(),
});

export type ModerationInput = z.infer<typeof moderationSchema>;

export const reviewReplySchema = z.object({
  body: z.string().min(1, "Reply is required").max(5000),
});

export type ReviewReplyInput = z.infer<typeof reviewReplySchema>;

export const reportSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(200),
  description: z.string().max(2000).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const voteSchema = z.object({
  helpful: z.boolean().default(true),
});

export type VoteInput = z.infer<typeof voteSchema>;

// ── Shipping ──────────────────────────────────────────
export const shippingZoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  countries: z.array(z.string()).default(["US"]),
  states: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  zipCodes: z.array(z.string()).default([]),
  zipRanges: z.array(z.object({
    start: z.string(),
    end: z.string(),
  })).optional(),
});
export type ShippingZoneInput = z.infer<typeof shippingZoneSchema>;

export const shippingMethodConfigSchema = z.object({
  rate: z.number().min(0).optional(),
  minWeight: z.number().min(0).optional(),
  maxWeight: z.number().min(0).optional(),
  minOrder: z.number().min(0).optional(),
  maxOrder: z.number().min(0).optional(),
});

export const shippingMethodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["flat", "weight_based", "price_based", "free"]),
  configuration: shippingMethodConfigSchema.default({}),
  carrier: z.string().optional(),
  carrierConfig: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type ShippingMethodInput = z.infer<typeof shippingMethodSchema>;

export const shippingRateSchema = z.object({
  zoneId: z.string().min(1),
  methodId: z.string().min(1),
  price: z.coerce.number().min(0),
});
export type ShippingRateInput = z.infer<typeof shippingRateSchema>;

export const shippingCalculateSchema = z.object({
  address: z.object({
    country: z.string(),
    state: z.string(),
    city: z.string().optional(),
    zip: z.string().optional(),
  }),
  items: z.array(z.object({
    variantId: z.string(),
    quantity: z.number().int().min(1),
    weight: z.number().min(0).optional(),
    price: z.number().min(0),
  })),
});
export type ShippingCalculateInput = z.infer<typeof shippingCalculateSchema>;

// ── Wishlist ──────────────────────────────────────────
export const wishlistAddSchema = z.object({
  variantId: z.string().min(1, "Variant is required"),
});

export type WishlistAddInput = z.infer<typeof wishlistAddSchema>;

export const wishlistMoveToCartSchema = z.object({
  wishlistItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});

export type WishlistMoveToCartInput = z.infer<typeof wishlistMoveToCartSchema>;

export const wishlistSyncSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

export type WishlistSyncInput = z.infer<typeof wishlistSyncSchema>;

// ── Tax ────────────────────────────────────────────────
export const taxZoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["country", "state", "region"]),
  country: z.string().default("US"),
  state: z.string().optional(),
  region: z.string().optional(),
  zipCodes: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});
export type TaxZoneInput = z.infer<typeof taxZoneSchema>;

export const taxRateSchema = z.object({
  zoneId: z.string().min(1, "Zone is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["percentage", "compound"]),
  rate: z.coerce.number().min(0, "Rate must be non-negative"),
  priority: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.union([z.string().datetime(), z.date()]).optional(),
  endsAt: z.union([z.string().datetime(), z.date()]).optional(),
});
export type TaxRateInput = z.infer<typeof taxRateSchema>;

export const taxCalculateSchema = z.object({
  amount: z.number().min(0),
  shipping: z.number().min(0).default(0),
  origin: z.object({
    country: z.string(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }),
  destination: z.object({
    country: z.string(),
    state: z.string().optional(),
    zip: z.string().optional(),
    city: z.string().optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    taxCode: z.string().optional(),
  })).optional(),
});
export type TaxCalculateInput = z.infer<typeof taxCalculateSchema>;
