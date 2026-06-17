import { NextResponse } from "next/server";
import { listCustomers, getCustomer, createCustomer } from "@/lib/services/customers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const id = searchParams.get("id");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  if (id) {
    const customer = await getCustomer(id);
    return NextResponse.json(customer ?? { error: "Not found" }, { status: customer ? 200 : 404 });
  }
  const customers = await listCustomers(tenantId);
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tenantId, ...data } = body;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  try {
    const customer = await createCustomer(data, tenantId);
    return NextResponse.json(customer, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
