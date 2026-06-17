import { NextRequest, NextResponse } from "next/server";
import { categoryRepo } from "@/lib/services/categories";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const { action, ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }
    if (action !== "archive" && action !== "delete") {
      return NextResponse.json({ error: "Invalid action. Use 'archive' or 'delete'." }, { status: 400 });
    }

    let count: number;
    if (action === "archive") count = await categoryRepo.bulkArchive(ids, { userId, tenantId });
    else count = await categoryRepo.bulkDelete(ids, { userId, tenantId });

    return NextResponse.json({ success: true, count });
  } catch (e) {
    return handleError(e);
  }
}
