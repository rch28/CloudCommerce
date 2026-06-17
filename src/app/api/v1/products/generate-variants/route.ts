import { NextRequest, NextResponse } from "next/server";
import { generateVariants } from "@/lib/services/options";
import { variantGenerateSchema } from "@/lib/schemas";
import { getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = variantGenerateSchema.parse(body);
    const results = await generateVariants(parsed.productId, parsed.options, parsed.basePrice, parsed.baseSku);
    return NextResponse.json(results, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
