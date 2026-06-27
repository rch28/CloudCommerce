import { NextRequest, NextResponse } from "next/server";
import { getTransfers, createTransfer } from "@/lib/services/warehouse";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const params = {
      page: parseInt(sp.get("page") ?? "1", 10),
      pageSize: parseInt(sp.get("pageSize") ?? "20", 10),
      status: sp.get("status") ?? undefined,
    };
    const result = await getTransfers(tenantId, params);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = await requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const result = await createTransfer(tenantId, body, { userId });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
