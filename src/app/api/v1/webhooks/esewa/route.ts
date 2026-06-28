import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ESewaProvider } from "@/lib/payments/esewa";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let transactionUuid: string | undefined;
  try {
    const parsed = JSON.parse(rawBody);
    transactionUuid = (parsed.transaction_uuid ?? parsed.pid) as string | undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!transactionUuid) {
    return NextResponse.json({ error: "Missing transaction_uuid in webhook payload" }, { status: 400 });
  }

  // Verify the payment via eSewa status API — never trust the body.
  let verificationResult: Awaited<ReturnType<ESewaProvider["verifyPayment"]>>;
  try {
    const provider = new ESewaProvider();
    verificationResult = await provider.verifyPayment(transactionUuid);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `eSewa verification failed: ${message}` }, { status: 400 });
  }

  if (verificationResult.status !== "succeeded") {
    return NextResponse.json({ received: true, status: verificationResult.status });
  }

  // Idempotency: record the event keyed on (provider, transactionUuid).
  try {
    await prisma.webhookEvent.create({
      data: { provider: "esewa", eventId: transactionUuid, eventType: "payment.success", rawBody, status: "processing" },
    });
  } catch {
    // Unique constraint violation — already processed.
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Find and fulfill the order linked to this transaction uuid.
  const order = await prisma.order.findFirst({
    where: { paymentIntentId: transactionUuid, status: { in: ["pending", "processing"] } },
  });
  if (order) {
    await prisma.order.updateMany({
      where: { id: order.id, status: { in: ["pending", "processing"] } },
      data: { status: "paid" },
    });
  }

  await prisma.webhookEvent.updateMany({
    where: { provider: "esewa", eventId: transactionUuid },
    data: { status: "processed", processedAt: new Date() },
  });

  return NextResponse.json({ received: true });
}
