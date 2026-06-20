import { NextRequest, NextResponse } from "next/server";
import { getWarehouses, createWarehouse } from "@/lib/services/warehouse";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const params = {
      page: parseInt(sp.get("page") ?? "1", 10),
      pageSize: parseInt(sp.get("pageSize") ?? "20", 10),
      orderBy: sp.get("orderBy") ?? undefined,
      order: (sp.get("order") ?? "asc") as "asc" | "desc" | undefined,
      isActive: sp.has("isActive") ? sp.get("isActive") === "true" : undefined,
    };

    const result = await getWarehouses(tenantId, params);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const record = await createWarehouse(tenantId, body, { userId });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
