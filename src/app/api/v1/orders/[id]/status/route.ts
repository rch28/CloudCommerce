import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusValidated } from "@/lib/services/orders";
import { getTenantId, getUserId, requirePermission } from "@/lib/api-helpers";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await requirePermission(request, "update");
    if (forbidden) return forbidden;

    const { id } = await params;
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const order = await updateOrderStatusValidated(id, status, tenantId, userId);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
