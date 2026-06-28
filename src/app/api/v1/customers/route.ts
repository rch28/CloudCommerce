import { NextRequest, NextResponse } from "next/server";
import { listCustomers, getCustomer, createCustomer } from "@/lib/services/customers";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const forbidden = await requirePermission(req, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const customer = await getCustomer(id, tenantId);
      if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(customer);
    }

    const customers = await listCustomers(tenantId);
    return NextResponse.json(customers);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const forbidden = await requirePermission(req, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const customer = await createCustomer(body, tenantId);
    return NextResponse.json(customer, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
