import { NextRequest, NextResponse } from "next/server";
import { listApiKeys, createApiKey, revokeApiKey } from "@/lib/services/api-keys";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const keys = await listApiKeys(tenantId);
    return NextResponse.json(keys);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const key = await createApiKey(body, tenantId, userId);
    return NextResponse.json(key, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest) {
  const forbidden = requirePermission(request, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const keyId = request.nextUrl.searchParams.get("keyId");
    if (!keyId) return NextResponse.json({ error: "keyId is required" }, { status: 400 });
    await revokeApiKey(keyId, tenantId, userId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
