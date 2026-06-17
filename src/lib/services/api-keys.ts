import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createApiKeySchema } from "@/lib/schemas";

interface ApiKeyRecord {
  id: string; tenantId: string; name: string; key: string; type: string;
  scopes: string[]; lastUsedAt: Date | null; expiresAt: Date | null;
  revokedAt: Date | null; createdAt: Date;
}

const mockKeys: Record<string, ApiKeyRecord[]> = {};

function generateKey(prefix = "cc"): string {
  const entropy = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}_${entropy}`;
}

export async function listApiKeys(tenantId: string): Promise<ApiKeyRecord[]> {
  if (process.env.DATABASE_URL) {
    return (prisma as any).apiKey.findMany({
      where: { tenantId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    }) as unknown as ApiKeyRecord[];
  }
  return [...(mockKeys[tenantId] ?? [])].filter((k) => !k.revokedAt);
}

export async function createApiKey(data: { name: string; scopes?: string[]; expiresInDays?: number }, tenantId: string, userId?: string): Promise<ApiKeyRecord> {
  const parsed = createApiKeySchema.parse(data);
  const key = generateKey();

  if (process.env.DATABASE_URL) {
    const expiresAt = parsed.expiresInDays ? new Date(Date.now() + parsed.expiresInDays * 86400000) : null;
    const record = await (prisma as any).apiKey.create({
      data: { name: parsed.name, key, scopes: parsed.scopes, type: "api", tenantId, expiresAt },
    });
    await logAudit({ entityType: "api_key", entityId: record.id, action: "api_key_generated", changes: { name: parsed.name, scopes: parsed.scopes }, userId, tenantId });
    return record as unknown as ApiKeyRecord;
  }

  const expiresAt = parsed.expiresInDays ? new Date(Date.now() + parsed.expiresInDays * 86400000) : null;
  const record: ApiKeyRecord = {
    id: `ak-${Date.now()}`, tenantId, name: parsed.name, key, type: "api",
    scopes: parsed.scopes, lastUsedAt: null, expiresAt, revokedAt: null, createdAt: new Date(),
  };

  const list = mockKeys[tenantId] ?? [];
  list.push(record);
  mockKeys[tenantId] = list;

  await logAudit({ entityType: "api_key", entityId: record.id, action: "api_key_generated", changes: { name: parsed.name, scopes: parsed.scopes }, userId, tenantId });
  return record;
}

export async function revokeApiKey(keyId: string, tenantId: string, userId?: string): Promise<void> {
  if (process.env.DATABASE_URL) {
    const record = await (prisma as any).apiKey.findFirst({ where: { id: keyId, tenantId } });
    if (!record) throw new Error("API key not found");
    await (prisma as any).apiKey.update({ where: { id: keyId }, data: { revokedAt: new Date() } });
    await logAudit({ entityType: "api_key", entityId: keyId, action: "api_key_revoked", changes: { name: record.name }, userId, tenantId });
    return;
  }

  const list = mockKeys[tenantId] ?? [];
  const idx = list.findIndex((k) => k.id === keyId);
  if (idx === -1) throw new Error("API key not found");
  list[idx].revokedAt = new Date();
  await logAudit({ entityType: "api_key", entityId: keyId, action: "api_key_revoked", changes: { name: list[idx].name }, userId, tenantId });
}
