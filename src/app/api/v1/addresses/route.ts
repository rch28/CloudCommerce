import { NextResponse } from "next/server";
import { listAddresses, getAddress, createAddress, updateAddress, deleteAddress } from "@/lib/services/addresses";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const id = searchParams.get("id");
  if (id) {
    const addr = await getAddress(id);
    return NextResponse.json(addr ?? { error: "Not found" }, { status: addr ? 200 : 404 });
  }
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });
  const addresses = await listAddresses(customerId);
  return NextResponse.json(addresses);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { customerId, ...data } = body;
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });
  try {
    const addr = await createAddress(customerId, data);
    return NextResponse.json(addr, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const addr = await updateAddress(id, data);
    return NextResponse.json(addr);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteAddress(id);
  return NextResponse.json({ success: true });
}
