import { NextRequest, NextResponse } from "next/server";
import { shippingRateSchema } from "@/lib/schemas";
import { setRate, deleteRate } from "@/lib/services/shipping";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = shippingRateSchema.parse(body);
    const rate = await setRate(parsed.zoneId, parsed.methodId, parsed.price);
    return NextResponse.json(rate, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to set rate";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { zoneId, methodId } = await request.json();
    if (!zoneId || !methodId) {
      return NextResponse.json({ error: "zoneId and methodId required" }, { status: 400 });
    }
    await deleteRate(zoneId, methodId);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete rate";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
