import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { getOrCreateAccount, getAccount } from "@/lib/services/loyalty";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const tenantId = request.headers.get("x-tenant-id") || "t-1";

    if (session?.role === "customer" && session.tenantId) {
      const customer = await prisma.customer.findUnique({
        where: { email_tenantId: { email: session.email, tenantId: session.tenantId } },
      });
      if (customer) {
        const account = await getAccount(session.tenantId, customer.id);
        if (account) {
          return NextResponse.json({
            ...account,
            points: account.points,
            lifetimePoints: account.lifetimePoints,
            tier: account.tier,
            enrolledAt: account.enrolledAt,
            transactions: account.transactions,
          });
        }
      }
    }

    const customerId = request.nextUrl.searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 });
    }

    const account = await getOrCreateAccount(tenantId, customerId);
    return NextResponse.json(account);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
