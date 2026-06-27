import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { getBanners, createBanner } from "@/lib/services/cms";

export async function GET(request: NextRequest) {
  const forbidden = await requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const result = await getBanners(tenantId, {
      search: sp.get("search") || undefined,
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
    const banner = await createBanner(body, { userId, tenantId });
    return NextResponse.json(banner, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
