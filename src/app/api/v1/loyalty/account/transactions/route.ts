import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { getTransactionHistory } from "@/lib/services/loyalty";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));

    if (session?.role === "customer" && session.tenantId) {
      const customer = await prisma.customer.findUnique({
        where: { email_tenantId: { email: session.email, tenantId: session.tenantId } },
      });
      if (customer) {
        const result = await getTransactionHistory(session.tenantId, customer.id, { page, limit });
        return NextResponse.json(result);
      }
    }

    return NextResponse.json({ items: [], total: 0, page, limit: 20, totalPages: 0 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
