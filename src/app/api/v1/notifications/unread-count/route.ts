import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";
import { getUnreadCount } from "@/lib/services/notifications";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const result = await getUnreadCount(tenantId, session.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
