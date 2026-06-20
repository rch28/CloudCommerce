import { NextRequest, NextResponse } from "next/server";
import { getMethod, updateMethod, deleteMethod } from "@/lib/services/shipping";

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
    const method = await getMethod(params.id, tenantId);
    if (!method) return NextResponse.json({ error: "Method not found" }, { status: 404 });
    return NextResponse.json(method);
  } catch {
    return NextResponse.json({ error: "Failed to fetch method" }, { status: 500 });
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
    const method = await updateMethod(params.id, tenantId, body);
    return NextResponse.json(method);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update method";
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
    await deleteMethod(params.id, tenantId);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete method";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
