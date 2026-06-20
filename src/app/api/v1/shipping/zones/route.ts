import { NextRequest, NextResponse } from "next/server";
import { shippingZoneSchema } from "@/lib/schemas";
import { listZones, createZone } from "@/lib/services/shipping";
import { getTenantId } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const zones = await listZones(tenantId);
    return NextResponse.json(zones);
  } catch {
    return NextResponse.json({ error: "Failed to fetch zones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const parsed = shippingZoneSchema.parse(body);
    const zone = await createZone(tenantId, parsed);
    return NextResponse.json(zone, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create zone";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
