// src/app/api/v1/coupons/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { couponSchema } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...coupon,
      value: Number(coupon.value),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const params = await paramsPromise;
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = couponSchema.partial().parse(body);

    const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.code !== undefined) updateData.code = parsed.code;
    if (parsed.type !== undefined) updateData.type = parsed.type;
    if (parsed.value !== undefined) updateData.value = parsed.value;
    if (parsed.maxDiscount !== undefined) updateData.maxDiscount = parsed.maxDiscount ?? null;
    if (parsed.minOrderAmount !== undefined) updateData.minOrderAmount = parsed.minOrderAmount ?? null;
    if (parsed.maxUses !== undefined) updateData.maxUses = parsed.maxUses ?? null;
    if (parsed.appliesTo !== undefined) updateData.appliesTo = parsed.appliesTo;
    if (parsed.productIds !== undefined) updateData.productIds = parsed.productIds;
    if (parsed.categoryIds !== undefined) updateData.categoryIds = parsed.categoryIds;
    if (parsed.customerIds !== undefined) updateData.customerIds = parsed.customerIds;
    if (parsed.firstOrderOnly !== undefined) updateData.firstOrderOnly = parsed.firstOrderOnly;
    if (parsed.startsAt !== undefined) updateData.startsAt = new Date(parsed.startsAt);
    if (parsed.expiresAt !== undefined) updateData.expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive;

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    });

    await logAudit({
      entityType: "coupon",
      entityId: coupon.id,
      action: "updated",
      changes: parsed,
      userId,
      tenantId,
    });

    return NextResponse.json({
      ...coupon,
      value: Number(coupon.value),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  try {
    const params = await paramsPromise;
    const tenantId = getTenantId(request);
    const userId = getUserId(request);

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAudit({
      entityType: "coupon",
      entityId: coupon.id,
      action: "disabled",
      changes: { isActive: false },
      userId,
      tenantId,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
