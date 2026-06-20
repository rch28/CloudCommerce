import { NextRequest, NextResponse } from "next/server";
import { shippingMethodSchema } from "@/lib/schemas";
import { listMethods, createMethod } from "@/lib/services/shipping";

function getTenantId(req: NextRequest): string {
  return req.headers.get("x-tenant-id") || req.nextUrl.searchParams.get("tenantId") || "t-1";
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const methods = await listMethods(tenantId);
    return NextResponse.json(methods);
  } catch {
    return NextResponse.json({ error: "Failed to fetch methods" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    const parsed = shippingMethodSchema.parse(body);
    const method = await createMethod(tenantId, parsed);
    return NextResponse.json(method, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create method";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
