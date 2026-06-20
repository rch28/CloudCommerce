// src/app/api/v1/promotions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { promotionSchema } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const promotion = await prisma.promotion.findUnique({
      where: { id: params.id },
      include: { rules: true, _count: { select: { usages: true } } },
    });
    if (!promotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
      maxDiscount: promotion.maxDiscount ? Number(promotion.maxDiscount) : null,
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
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const parsed = promotionSchema.partial().parse(body);

    const existing = await prisma.promotion.findUnique({
      where: { id: params.id },
      include: { rules: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description ?? null;
    if (parsed.type !== undefined) updateData.type = parsed.type;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority;
    if (parsed.discountType !== undefined) updateData.discountType = parsed.discountType;
    if (parsed.discountValue !== undefined) updateData.discountValue = parsed.discountValue;
    if (parsed.maxDiscount !== undefined) updateData.maxDiscount = parsed.maxDiscount ?? null;
    if (parsed.startsAt !== undefined) updateData.startsAt = new Date(parsed.startsAt);
    if (parsed.expiresAt !== undefined) updateData.expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive;

    if (parsed.rules !== undefined) {
      await prisma.promotionRule.deleteMany({ where: { promotionId: params.id } });
      await prisma.promotionRule.createMany({
        data: parsed.rules.map((r) => ({
          promotionId: params.id,
          type: r.type,
          value: r.value,
          tenantId,
        })),
      });
    }

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: updateData,
      include: { rules: true },
    });

    await logAudit({
      entityType: "promotion",
      entityId: promotion.id,
      action: "updated",
      changes: parsed,
      userId,
      tenantId,
    });

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
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
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAudit({
      entityType: "promotion",
      entityId: promotion.id,
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
