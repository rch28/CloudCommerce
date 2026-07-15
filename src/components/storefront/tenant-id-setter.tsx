"use client";

import { useEffect } from "react";
import { setTenantId } from "@/contexts/CartContext";

export function TenantIdSetter({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    setTenantId(tenantId);
  }, [tenantId]);
  return null;
}
