import { NextRequest, NextResponse } from "next/server";
import { productRepo } from "@/lib/services/products";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const result = await productRepo.list(tenantId, {
      search: sp.get("search") || undefined,
      categoryId: sp.get("category") || undefined,
      status: sp.get("status") || undefined,
      orderBy: sp.get("sort") || undefined,
      order: (sp.get("order") as "asc" | "desc") || undefined,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || 10,
    });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const product = await productRepo.createOne(body, { userId, tenantId });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
