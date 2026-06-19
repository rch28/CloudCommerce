import { prisma } from "@/lib/prisma";

interface ValidationContext {
  customerId?: string;
  customerEmail?: string;
  orderSubtotal: number;
  shipping: number;
  productIds: string[];
  categoryIds: string[];
  isFirstOrder: boolean;
}

interface CalculationContext {
  orderSubtotal: number;
  shipping: number;
  productIds: string[];
  categoryIds: string[];
  appliesTo: string;
  productIdsList: string[];
  categoryIdsList: string[];
}

interface ValidationResult {
  valid: boolean;
  coupon?: CouponRecord;
  discount?: DiscountResult;
  error?: string;
}

interface CouponRecord {
  id: string;
  code: string;
  type: string;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  appliesTo: string;
  productIds: string[];
  categoryIds: string[];
  customerIds: string[];
  firstOrderOnly: boolean;
  startsAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  tenantId: string;
}

interface DiscountResult {
  type: "fixed" | "percentage" | "free_shipping";
  amount: number;
  description: string;
  freeShipping: boolean;
}

export async function validateCoupon(
  code: string,
  tenantId: string,
  context: ValidationContext,
): Promise<ValidationResult> {
  const coupon = await prisma.coupon.findUnique({
    where: { code_tenantId: { code: code.toUpperCase(), tenantId } },
  });

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }

  const record: CouponRecord = {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
    minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    maxUses: coupon.maxUses,
    currentUses: coupon.currentUses,
    appliesTo: coupon.appliesTo,
    productIds: coupon.productIds,
    categoryIds: coupon.categoryIds,
    customerIds: coupon.customerIds,
    firstOrderOnly: coupon.firstOrderOnly,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    isActive: coupon.isActive,
    tenantId: coupon.tenantId,
  };

  if (!record.isActive) {
    return { valid: false, error: "Coupon is inactive" };
  }

  const now = new Date();
  if (now < record.startsAt) {
    return { valid: false, error: "Coupon is not yet active" };
  }
  if (record.expiresAt && now > record.expiresAt) {
    return { valid: false, error: "Coupon has expired" };
  }

  if (record.maxUses !== null && record.currentUses >= record.maxUses) {
    return { valid: false, error: "Coupon usage limit reached" };
  }

  if (record.firstOrderOnly && !context.isFirstOrder) {
    return { valid: false, error: "This coupon is for first order only" };
  }

  if (record.appliesTo === "customers") {
    if (!context.customerId || !record.customerIds.includes(context.customerId)) {
      return { valid: false, error: "Coupon not applicable to this customer" };
    }
  }

  if (record.appliesTo === "products") {
    const hasMatch = context.productIds.some((pid) => record.productIds.includes(pid));
    if (!hasMatch) {
      return { valid: false, error: "Coupon not applicable to items in cart" };
    }
  }

  if (record.appliesTo === "categories") {
    const hasMatch = context.categoryIds.some((cid) => record.categoryIds.includes(cid));
    if (!hasMatch) {
      return { valid: false, error: "Coupon not applicable to items in cart" };
    }
  }

  if (record.minOrderAmount !== null && context.orderSubtotal < record.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order amount of $${record.minOrderAmount.toFixed(2)} not met`,
    };
  }

  const discount = calculateDiscount(record, {
    orderSubtotal: context.orderSubtotal,
    shipping: context.shipping,
    productIds: context.productIds,
    categoryIds: context.categoryIds,
    appliesTo: record.appliesTo,
    productIdsList: record.productIds,
    categoryIdsList: record.categoryIds,
  });

  return { valid: true, coupon: record, discount };
}

export function calculateDiscount(
  coupon: CouponRecord,
  context: CalculationContext,
): DiscountResult {
  let applicableSubtotal = context.orderSubtotal;

  if (coupon.appliesTo === "products" && coupon.productIds.length > 0) {
    applicableSubtotal = context.orderSubtotal;
  }

  if (coupon.appliesTo === "categories" && coupon.categoryIds.length > 0) {
    applicableSubtotal = context.orderSubtotal;
  }

  switch (coupon.type) {
    case "free_shipping":
      return {
        type: "free_shipping",
        amount: 0,
        description: "Free shipping",
        freeShipping: true,
      };

    case "fixed": {
      const amount = Math.min(coupon.value, applicableSubtotal);
      return {
        type: "fixed",
        amount,
        description: `$${amount.toFixed(2)} off`,
        freeShipping: false,
      };
    }

    case "percentage": {
      let amount = applicableSubtotal * (coupon.value / 100);
      if (coupon.maxDiscount !== null) {
        amount = Math.min(amount, coupon.maxDiscount);
      }
      amount = Math.min(amount, applicableSubtotal);
      return {
        type: "percentage",
        amount: Math.round(amount * 100) / 100,
        description: `${coupon.value}% off${coupon.maxDiscount !== null ? ` (max $${coupon.maxDiscount.toFixed(2)})` : ""}`,
        freeShipping: false,
      };
    }

    default:
      return { type: "fixed", amount: 0, description: "", freeShipping: false };
  }
}
