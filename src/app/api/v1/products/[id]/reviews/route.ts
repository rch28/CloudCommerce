import { NextRequest, NextResponse } from "next/server";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";
import { listReviews } from "@/lib/services/reviews";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const params = await paramsPromise;
    const tenantId = await getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
    const status = sp.get("status") || undefined;
    const customerId = sp.get("customerId") || undefined;

    const result = await listReviews(tenantId, {
      productId: params.id,
      status,
      customerId,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
