import { NextRequest, NextResponse } from "next/server";
import { getUploadProvider } from "@/lib/upload";
import { requirePermission, handleError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const path = (formData.get("path") as string) || "products";
    const provider = getUploadProvider();
    const result = await provider.upload(file, path);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
