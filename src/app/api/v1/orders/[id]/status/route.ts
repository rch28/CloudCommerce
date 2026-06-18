import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusValidated } from "@/lib/services/orders";
import { getSessionUser } from "@/lib/get-session";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "admin" && session.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const order = await updateOrderStatusValidated(id, status, tenantId, session.id);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
