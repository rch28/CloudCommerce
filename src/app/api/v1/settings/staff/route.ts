import { NextRequest, NextResponse } from "next/server";
import { listStaff, inviteStaff, removeStaff, updateStaffRole } from "@/lib/services/staff";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const staff = await listStaff(tenantId);
    return NextResponse.json(staff);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = await requirePermission(request, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const result = await inviteStaff(body, tenantId, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest) {
  const forbidden = await requirePermission(request, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const staffId = request.nextUrl.searchParams.get("staffId");
    if (!staffId) return NextResponse.json({ error: "staffId is required" }, { status: 400 });
    await removeStaff(staffId, tenantId, userId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest) {
  const forbidden = await requirePermission(request, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const result = await updateStaffRole(body, tenantId, userId);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
