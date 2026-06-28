import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { getOrCreateAccount, getAccount } from "@/lib/services/loyalty";
import { getTenantId, requirePermission } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();

    // Customers can only see their own loyalty account.
    if (session?.role === "customer" && session.tenantId) {
      const customer = await prisma.customer.findUnique({
        where: { email_tenantId: { email: session.email, tenantId: session.tenantId } },
      });
      if (customer) {
        const account = await getAccount(session.tenantId, customer.id);
        if (account) return NextResponse.json(account);
      }
      return NextResponse.json({ error: "Loyalty account not found" }, { status: 404 });
    }

    // Merchant/admin looking up a specific customer's account requires explicit auth.
    const forbidden = await requirePermission(request, "read");
    if (forbidden) return forbidden;

    const tenantId = await getTenantId(request);
    const customerId = request.nextUrl.searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json({ error: "customerId required" }, { status: 400 });
    }

    const account = await getOrCreateAccount(tenantId, customerId);
    return NextResponse.json(account);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
