import { NextRequest, NextResponse } from "next/server";
import { categoryRepo } from "@/lib/services/categories";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const categories = await categoryRepo.list(tenantId, { search });
    return NextResponse.json(categories);
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
    const category = await categoryRepo.createOne(body, { userId, tenantId });
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
