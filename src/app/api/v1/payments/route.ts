import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/payments";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

const PROVIDER_ENUM = z.enum(["stripe", "khalti", "esewa"]);

const createPaymentSchema = z.object({
  action: z.literal("create_payment"),
  provider: PROVIDER_ENUM,
  amount: z.number().positive(),
  subscriptionId: z.string().optional(),
  description: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

const verifyPaymentSchema = z.object({
  action: z.literal("verify_payment"),
  provider: PROVIDER_ENUM,
  providerPaymentId: z.string().min(1),
});

const refundPaymentSchema = z.object({
  action: z.literal("refund_payment"),
  provider: PROVIDER_ENUM,
  providerPaymentId: z.string().min(1),
  amount: z.number().positive().optional(),
});

const bodySchema = z.discriminatedUnion("action", [
  createPaymentSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
]);

export async function GET(req: NextRequest) {
  const forbidden = await requirePermission(req, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const { listPayments } = await import("@/lib/services/subscriptions");
    const payments = await listPayments(tenantId);
    return NextResponse.json(payments);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const forbidden = await requirePermission(req, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const rawBody = await req.json();
    const parse = bodySchema.safeParse(rawBody);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid request", details: parse.error.flatten() }, { status: 400 });
    }
    const body = parse.data;
    const provider = getProvider(body.provider);

    if (body.action === "create_payment") {
      const result = await provider.createPayment({
        amount: body.amount,
        description: body.description,
        returnUrl: body.returnUrl,
        metadata: { tenantId, subscriptionId: body.subscriptionId ?? "" },
      });
      // Do NOT record as succeeded here — payment is only confirmed via webhook.
      return NextResponse.json(result, { status: 201 });
    }

    if (body.action === "verify_payment") {
      const result = await provider.verifyPayment(body.providerPaymentId);
      return NextResponse.json(result);
    }

    if (body.action === "refund_payment") {
      // Verify the payment/order belongs to this tenant before issuing refund.
      const { prisma } = await import("@/lib/prisma");
      const order = await prisma.order.findFirst({
        where: { paymentIntentId: body.providerPaymentId, tenantId },
        select: { id: true, total: true, status: true },
      });
      if (!order) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
      // Cap refund to the captured amount.
      const maxRefund = Number(order.total);
      const refundAmount = body.amount !== undefined ? Math.min(body.amount, maxRefund) : undefined;
      const result = await provider.refundPayment(body.providerPaymentId, refundAmount);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return handleError(err);
  }
}
