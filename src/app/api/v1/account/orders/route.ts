import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });

    if (!customer) {
      return NextResponse.json({ orders: [], total: 0, page, limit });
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where: { customerId: customer.id } }),
    ]);

    return NextResponse.json({
      orders: orders.map(({ _count, ...o }) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        total: o.total,
        items: _count.items,
        date: o.createdAt,
      })),
      total,
      page,
      limit,
    });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
