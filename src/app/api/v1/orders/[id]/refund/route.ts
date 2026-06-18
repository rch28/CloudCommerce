import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { refundPayment } from "@/lib/services/payment";
import { updateOrderStatusValidated } from "@/lib/services/orders";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "admin" && session.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const order = await prisma.order.findFirst({ where: { id, tenantId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.paymentIntentId) {
      return NextResponse.json({ error: "No payment intent to refund" }, { status: 400 });
    }
    if (order.status !== "paid" && order.status !== "delivered") {
      return NextResponse.json({ error: "Order must be paid or delivered to refund" }, { status: 400 });
    }

    const body = await request.json();
    const amount = body.amount ? Number(body.amount) : undefined;

    await refundPayment(order.paymentIntentId, amount);

    await updateOrderStatusValidated(id, "refunded", tenantId, session.id);

    return NextResponse.json({ success: true, orderId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
