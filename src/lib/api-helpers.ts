import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mapRole, can, type Permission } from "./permissions";

export function getTenantId(request: NextRequest): string {
  return request.headers.get("x-tenant-id") || "t-1";
}

export function getUserId(_request: NextRequest): string | undefined {
  return undefined;
}

export function getUserRole(request: NextRequest): string {
  return request.headers.get("x-user-role") || "merchant";
}

export function requirePermission(request: NextRequest, permission: Permission) {
  const role = mapRole(getUserRole(request));
  if (!can(role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function handleError(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
