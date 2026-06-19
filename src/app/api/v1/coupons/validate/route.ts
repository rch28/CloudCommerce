// src/app/api/v1/coupons/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/services/discounts";
import { couponValidateSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = couponValidateSchema.parse(body);

    let isFirstOrder = parsed.isFirstOrder;
    if (!isFirstOrder && parsed.customerId) {
      const orderCount = await prisma.order.count({
        where: { customerId: parsed.customerId, tenantId: parsed.tenantId },
      });
      isFirstOrder = orderCount === 0;
    }

    const result = await validateCoupon(parsed.code, parsed.tenantId, {
      customerId: parsed.customerId,
      orderSubtotal: parsed.subtotal,
      shipping: parsed.shipping,
      productIds: parsed.productIds,
      categoryIds: parsed.categoryIds,
      isFirstOrder,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Validation failed";
    return NextResponse.json({ valid: false, error: message }, { status: 400 });
  }
}
