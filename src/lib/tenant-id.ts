let _tenantIdOverride: string | null = null;

export function setTenantId(id: string) {
  _tenantIdOverride = id;
}

export function getTenantFromPath(): string | undefined {
  if (_tenantIdOverride) return _tenantIdOverride;
  if (typeof window === "undefined") return undefined;
  const match = window.location.pathname.match(/\/store\/([^/]+)/);
  return match ? match[1] : undefined;
}
