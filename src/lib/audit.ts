import { prisma } from "./prisma";
type EntityType = "product" | "category" | "variant" | "product_image" | "product_option" | "inventory" | "order" | "subscription" | "payment" | "settings" | "staff" | "api_key" | "coupon" | "promotion" | "promotion_usage";

type Action = "created" | "updated" | "deleted" | "archived" | "stock_adjusted" | "subscribed" | "upgraded" | "downgraded" | "canceled" | "payment_received" | "payment_refunded" | "invited" | "removed" | "role_changed" | "api_key_generated" | "api_key_revoked" | "disabled" | "discount_applied";

interface LogInput {
  entityType: EntityType;
  entityId: string;
  action: Action;
  changes?: Record<string, unknown>;
  userId?: string;
  tenantId: string;
}

export async function logAudit(input: LogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        changes: input.changes ? JSON.stringify(input.changes) : null,
        userId: input.userId,
        tenantId: input.tenantId,
      },
    });
  } catch {
    // fail silently - audit should never block the primary operation
  }
}
