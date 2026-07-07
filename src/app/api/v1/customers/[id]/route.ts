import { NextRequest, NextResponse } from "next/server";
import { getCustomer } from "@/lib/services/customers";
import { getTenantId, requirePermission } from "@/lib/api-helpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await requirePermission(request, "read");
    if (forbidden) return forbidden;

    const { id } = await params;
    const tenantId = await getTenantId(request);

    const customer = await getCustomer(id, tenantId);
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ customer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
