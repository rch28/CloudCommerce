import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
      select: {
        id: true,
        number: true,
        status: true,
        subtotal: true,
        shipping: true,
        tax: true,
        total: true,
        notes: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            sku: true,
            price: true,
            quantity: true,
            image: true,
          },
        },
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json({ found: false, order: null });
    }

    return NextResponse.json({
      found: true,
      order: {
        ...order,
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        tax: Number(order.tax),
        total: Number(order.total),
        items: order.items.map((i) => ({ ...i, price: Number(i.price) })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
