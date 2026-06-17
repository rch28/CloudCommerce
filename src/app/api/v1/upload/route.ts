import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { IMAGE_CONFIG } from "@/lib/image";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const provider = getStorageProvider();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Validate
    if (!IMAGE_CONFIG.allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type: ${file.type}. Allowed: ${IMAGE_CONFIG.allowedMimeTypes.join(", ")}`,
      }, { status: 400 });
    }
    if (file.size > IMAGE_CONFIG.maxFileSize) {
      return NextResponse.json({
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${Math.floor(IMAGE_CONFIG.maxFileSize / 1024 / 1024)}MB`,
      }, { status: 400 });
    }

    const path = (formData.get("path") as string) || "products";
    const result = await provider.upload(file, { path, tenantId });

    await logAudit({
      entityType: "product_image",
      entityId: result.filename,
      action: "created",
      changes: { filename: result.filename, size: result.size, mimeType: result.mimeType },
      userId,
      tenantId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const provider = getStorageProvider();
    const { url } = await request.json();

    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    await provider.delete(url);

    await logAudit({
      entityType: "product_image",
      entityId: url,
      action: "deleted",
      changes: { url },
      userId,
      tenantId,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
