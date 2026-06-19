import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";
import { getPreferences, updatePreference } from "@/lib/services/notifications";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const result = await getPreferences(tenantId, session.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const body = await request.json();
    const { channel, events, enabled } = body;
    if (!channel || !Array.isArray(events)) {
      return NextResponse.json({ error: "channel and events required" }, { status: 400 });
    }

    const result = await updatePreference(tenantId, session.id, channel, events, enabled ?? true);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
