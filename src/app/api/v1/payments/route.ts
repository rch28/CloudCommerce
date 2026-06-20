import { NextResponse } from "next/server";
import { listPayments, recordPayment } from "@/lib/services/subscriptions";
import { getProvider } from "@/lib/payments";
import { handleError } from "@/lib/api-helpers";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id") || "t-1";
  const payments = await listPayments(tenantId);
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id") || "t-1";
  try {
    const body = await req.json();
    const { action, provider: providerName, amount, subscriptionId, description, returnUrl } = body;

    if (action === "create_payment") {
      const provider = getProvider(providerName || "stripe");
      const result = await provider.createPayment({
        amount, description, returnUrl,
        metadata: { tenantId, subscriptionId },
      });
      await recordPayment(tenantId, subscriptionId, amount, providerName || "stripe", { description });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "verify_payment") {
      const provider = getProvider(body.provider || "stripe");
      const result = await provider.verifyPayment(body.providerPaymentId);
      return NextResponse.json(result);
    }

    if (action === "refund_payment") {
      const provider = getProvider(body.provider || "stripe");
      const result = await provider.refundPayment(body.providerPaymentId, body.amount);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return handleError(err);
  }
}
