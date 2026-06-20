import { NextRequest, NextResponse } from "next/server";
import { redisClient, makeCacheKey } from "@/lib/redis";
import { getTenantId, getUserId, handleError } from "@/lib/api-helpers";
import { loyaltySettingsSchema } from "@/lib/schemas/loyalty";
import { logAudit } from "@/lib/audit";

const DEFAULT_SETTINGS = {
  pointsPerCurrency: 1,
  signupPoints: 100,
  referralPoints: 50,
  reviewPoints: 25,
  birthdayPoints: 50,
};

function getRedis() {
  if (!redisClient) return null;
  return redisClient;
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const r = getRedis();

    let settings = null;
    if (r) {
      try {
        const raw = await r.get(makeCacheKey("loyalty", "settings", tenantId));
        settings = raw ? JSON.parse(raw) : null;
      } catch {
        settings = null;
      }
    }

    return NextResponse.json(settings || DEFAULT_SETTINGS);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = loyaltySettingsSchema.parse(body);

    const r = getRedis();
    if (r) {
      await r.set(makeCacheKey("loyalty", "settings", tenantId), JSON.stringify(parsed));
    }

    await logAudit({
      entityType: "settings",
      entityId: "loyalty",
      action: "updated",
      changes: parsed as unknown as Record<string, unknown>,
      userId,
      tenantId,
    });

    return NextResponse.json(parsed);
  } catch (e) {
    return handleError(e);
  }
}
