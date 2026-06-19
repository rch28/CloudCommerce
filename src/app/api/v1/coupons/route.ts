// src/app/api/v1/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { couponSchema } from "@/lib/schemas";
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
    const search = sp.get("search");
    if (search) where.code = { contains: search, mode: "insensitive" };
    const type = sp.get("type");
    if (type) where.type = type;
    const isActive = sp.get("isActive");
    if (isActive !== null) where.isActive = isActive === "true";

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((c) => ({ ...c, value: Number(c.value), maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null, minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null })),
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
    const parsed = couponSchema.parse(body);

    const existing = await prisma.coupon.findUnique({
      where: { code_tenantId: { code: parsed.code, tenantId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: parsed.code,
        type: parsed.type,
        value: parsed.value,
        maxDiscount: parsed.maxDiscount ?? null,
        minOrderAmount: parsed.minOrderAmount ?? null,
        maxUses: parsed.maxUses ?? null,
        appliesTo: parsed.appliesTo,
        productIds: parsed.productIds,
        categoryIds: parsed.categoryIds,
        customerIds: parsed.customerIds,
        firstOrderOnly: parsed.firstOrderOnly,
        startsAt: new Date(parsed.startsAt),
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        isActive: parsed.isActive,
        tenantId,
      },
    });

    await logAudit({
      entityType: "coupon",
      entityId: coupon.id,
      action: "created",
      changes: parsed,
      userId,
      tenantId,
    });

    return NextResponse.json({ ...coupon, value: Number(coupon.value) }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
