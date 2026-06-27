import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { addSection, removeSection, updateSection, reorderSections } from "@/lib/services/cms";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requirePermission(request, "create");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const section = await addSection(id, body, { userId, tenantId });
    return NextResponse.json(section, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requirePermission(request, "update");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();

    if (body.action === "reorder") {
      await reorderSections(id, body.sectionIds, { userId, tenantId });
      return NextResponse.json({ success: true });
    }

    if (body.action === "update") {
      const section = await updateSection(body.sectionId, body.data, { userId, tenantId });
      return NextResponse.json(section);
    }

    if (body.action === "delete") {
      await removeSection(body.sectionId, { userId, tenantId });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return handleError(e);
  }
}
