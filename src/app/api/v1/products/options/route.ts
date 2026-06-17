import { NextRequest, NextResponse } from "next/server";
import { listProductOptions, createOption, deleteOption, createOptionValue } from "@/lib/services/options";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const productId = request.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }
    const options = await listProductOptions(productId);
    return NextResponse.json(options);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const body = await request.json();

    if (body.action === "createValue") {
      const value = await createOptionValue(body.optionId, body.label, body.value, body.variantId, body.sortOrder);
      return NextResponse.json(value, { status: 201 });
    }

    const option = await createOption(body.productId, body.name, body.sortOrder);
    return NextResponse.json(option, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await deleteOption(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
