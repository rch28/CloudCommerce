import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";
import { resendConfirmationEmail } from "@/lib/services/orders";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "admin" && session.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    await resendConfirmationEmail(id, tenantId);

    return NextResponse.json({ success: true, orderId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
