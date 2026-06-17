import { NextRequest, NextResponse } from "next/server";
import { getStockHistory } from "@/lib/services/inventory";
import { requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const variantId = request.nextUrl.searchParams.get("variantId");
    if (!variantId) {
      return NextResponse.json({ error: "variantId is required" }, { status: 400 });
    }
    const history = await getStockHistory(variantId);
    return NextResponse.json(history);
  } catch (e) {
    return handleError(e);
  }
}
