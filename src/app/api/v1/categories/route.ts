import { NextRequest, NextResponse } from "next/server";
import { listCategories, createCategory } from "@/lib/services/categories";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const categories = await listCategories(tenantId, search);
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
    const body = await request.json();
    const category = await createCategory(body, tenantId);
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
