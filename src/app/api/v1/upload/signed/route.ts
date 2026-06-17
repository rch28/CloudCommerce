import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";
import { IMAGE_CONFIG } from "@/lib/image";

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const provider = getStorageProvider();
    const { filename, mimeType, path } = await request.json();

    if (!filename || !mimeType) {
      return NextResponse.json({ error: "filename and mimeType are required" }, { status: 400 });
    }
    if (!IMAGE_CONFIG.allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json({ error: `Invalid mime type: ${mimeType}` }, { status: 400 });
    }

    const result = await provider.getSignedUploadUrl(filename, mimeType, { path: path || "products", tenantId });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
