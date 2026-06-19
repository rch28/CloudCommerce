import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { reviewReplySchema } from "@/lib/schemas";
import { replyToReview } from "@/lib/services/reviews";

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const params = await paramsPromise;
    const tenantId = getTenantId(request);
    const userId = getUserId(request);

    const body = await request.json();
    const parsed = reviewReplySchema.parse(body);

    const reply = await replyToReview(params.id, parsed.body, userId, tenantId);

    return NextResponse.json(reply, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
