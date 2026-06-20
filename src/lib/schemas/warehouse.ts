import { z } from "zod/v4";

export const warehouseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  code: z.string().min(1, "Code is required").max(20),
  type: z.string().default("main"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("US"),
  zip: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const warehouseUpdateSchema = warehouseSchema.partial();

export const stockTransferSchema = z.object({
  fromWarehouseId: z.string().min(1, "Source warehouse is required"),
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  variantId: z.string().min(1, "Variant is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export const warehouseInventorySchema = z.object({
  warehouseId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

export const allocateInventoryItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const allocateInventorySchema = z.object({
  items: z.array(allocateInventoryItemSchema).min(1, "At least one item is required"),
  destination: z.object({
    country: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
});

export const reserveStockSchema = z.object({
  warehouseId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const releaseStockSchema = z.object({
  warehouseId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const confirmDeductionSchema = z.object({
  warehouseId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type WarehouseUpdateInput = z.infer<typeof warehouseUpdateSchema>;
export type StockTransferInput = z.infer<typeof stockTransferSchema>;
export type WarehouseInventoryInput = z.infer<typeof warehouseInventorySchema>;
export type AllocateInventoryInput = z.infer<typeof allocateInventorySchema>;
export type ReserveStockInput = z.infer<typeof reserveStockSchema>;
export type ReleaseStockInput = z.infer<typeof releaseStockSchema>;
export type ConfirmDeductionInput = z.infer<typeof confirmDeductionSchema>;
