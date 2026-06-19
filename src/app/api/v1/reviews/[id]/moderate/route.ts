import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { moderationSchema } from "@/lib/schemas";
import { moderateReview } from "@/lib/services/reviews";

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const params = await paramsPromise;
    const tenantId = getTenantId(request);
    const userId = getUserId(request);

    const body = await request.json();
    const parsed = moderationSchema.parse(body);

    const updated = await moderateReview(params.id, parsed.status, userId || "system", tenantId, userId);

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}
