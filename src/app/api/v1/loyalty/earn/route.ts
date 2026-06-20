import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, handleError } from "@/lib/api-helpers";
import { pointsAdjustSchema } from "@/lib/schemas/loyalty";
import { earnPoints } from "@/lib/services/loyalty";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = pointsAdjustSchema.parse(body);

    const isPositive = parsed.points > 0;

    if (isPositive) {
      const result = await earnPoints(tenantId, parsed.customerId, "adjusted", undefined, parsed.reason);
      return NextResponse.json(result);
    }
    const account = await prisma.loyaltyAccount.findUnique({
      where: { customerId_tenantId: { customerId: parsed.customerId, tenantId } },
    });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (account.points < Math.abs(parsed.points)) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }

    const points = Math.abs(parsed.points);
    const updated = await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: { decrement: points } },
    });

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        tenantId,
        type: "adjusted",
        points: -points,
        balanceBefore: account.points,
        balanceAfter: updated.points,
        referenceType: "adjusted",
        description: parsed.reason,
      },
    });

    await logAudit({
      entityType: "loyalty_account",
      entityId: account.id,
      action: "points_adjusted",
      changes: { points: -points, reason: parsed.reason },
      userId,
      tenantId,
    });

    return NextResponse.json(transaction);
  } catch (e) {
    return handleError(e);
  }
}
