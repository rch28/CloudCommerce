// src/app/api/v1/promotions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { promotionSchema } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { tenantId };
    const isActive = sp.get("isActive");
    if (isActive !== null) where.isActive = isActive === "true";

    const [items, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        include: { rules: true, _count: { select: { usages: true } } },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.promotion.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((p) => ({
        ...p,
        discountValue: Number(p.discountValue),
        maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = promotionSchema.parse(body);

    const promotion = await prisma.promotion.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        type: parsed.type,
        priority: parsed.priority,
        discountType: parsed.discountType,
        discountValue: parsed.discountValue,
        maxDiscount: parsed.maxDiscount ?? null,
        startsAt: new Date(parsed.startsAt),
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        isActive: parsed.isActive,
        tenantId,
        rules: {
          create: parsed.rules.map((r) => ({
            type: r.type,
            value: r.value,
            tenantId,
          })),
        },
      },
      include: { rules: true },
    });

    await logAudit({
      entityType: "promotion",
      entityId: promotion.id,
      action: "created",
      changes: parsed,
      userId,
      tenantId,
    });

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
    }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
