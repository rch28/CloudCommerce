import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { getPages, createPage } from "@/lib/services/cms";

export async function GET(request: NextRequest) {
  const forbidden = await requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const result = await getPages(tenantId, {
      search: sp.get("search") || undefined,
      status: sp.get("status") || undefined,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || 20,
    });
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
    const page = await createPage(body, { userId, tenantId });
    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
