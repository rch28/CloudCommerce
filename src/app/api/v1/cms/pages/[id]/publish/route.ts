import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { publishPage } from "@/lib/services/cms";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const { publish } = await request.json();
    const page = await publishPage(id, publish ?? true, { userId, tenantId });
    return NextResponse.json(page);
  } catch (e) {
    return handleError(e);
  }
}
