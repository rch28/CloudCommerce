import { NextRequest, NextResponse } from "next/server";
import { getOrderDetail } from "@/lib/services/orders";
import { getTenantId, requirePermission } from "@/lib/api-helpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await requirePermission(request, "read");
    if (forbidden) return forbidden;

    const { id } = await params;
    const tenantId = await getTenantId(request);

    const order = await getOrderDetail(id, tenantId);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
