import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { wishlistSyncSchema } from "@/lib/schemas";
import { syncAfterLogin } from "@/lib/services/wishlist";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const body = await request.json();
    const parsed = wishlistSyncSchema.parse(body);

    await syncAfterLogin(parsed.sessionId, customer.id, session.tenantId!);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to sync wishlist" }, { status: 400 });
  }
}
