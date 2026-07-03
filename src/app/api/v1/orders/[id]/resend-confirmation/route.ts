import { NextRequest, NextResponse } from "next/server";
import { getTenantId, requirePermission } from "@/lib/api-helpers";
import { resendConfirmationEmail } from "@/lib/services/orders";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await requirePermission(request, "update");
    if (forbidden) return forbidden;

    const { id } = await params;
    const tenantId = await getTenantId(request);

    await resendConfirmationEmail(id, tenantId);

    return NextResponse.json({ success: true, orderId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
