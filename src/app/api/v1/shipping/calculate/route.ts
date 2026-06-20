import { NextRequest, NextResponse } from "next/server";
import { shippingCalculateSchema } from "@/lib/schemas";
import { calculateShipping } from "@/lib/services/shipping";

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "t-1";
    const body = await request.json();
    const parsed = shippingCalculateSchema.parse(body);
    const options = await calculateShipping(tenantId, parsed.address, parsed.items);
    return NextResponse.json({ options });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to calculate shipping";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
