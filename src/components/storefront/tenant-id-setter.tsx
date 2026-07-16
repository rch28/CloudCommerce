"use client";

import { useEffect } from "react";
import { setTenantId } from "@/lib/tenant-id";

export function TenantIdSetter({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    setTenantId(tenantId);
  }, [tenantId]);
  return null;
}
