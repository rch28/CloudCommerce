import { NextRequest, NextResponse } from "next/server";
import { getZone, updateZone, deleteZone } from "@/lib/services/shipping";

function getTenantId(req: NextRequest): string {
  return req.headers.get("x-tenant-id") || "t-1";
}

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const tenantId = getTenantId(request);
    const zone = await getZone(params.id, tenantId);
    if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    return NextResponse.json(zone);
  } catch {
    return NextResponse.json({ error: "Failed to fetch zone" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const tenantId = getTenantId(request);
    const body = await request.json();
    const zone = await updateZone(params.id, tenantId, body);
    return NextResponse.json(zone);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update zone";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const tenantId = getTenantId(request);
    await deleteZone(params.id, tenantId);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete zone";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
