import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { KhaltiProvider } from "@/lib/payments/khalti";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let pidx: string | undefined;
  try {
    const parsed = JSON.parse(rawBody);
    // Khalti sends pidx in the callback body to identify the transaction.
    pidx = parsed.pidx as string | undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!pidx) {
    return NextResponse.json({ error: "Missing pidx in webhook payload" }, { status: 400 });
  }

  // Verify the payment status via Khalti lookup API — never trust the body.
  let verificationResult: Awaited<ReturnType<KhaltiProvider["verifyPayment"]>>;
  try {
    const provider = new KhaltiProvider();
    verificationResult = await provider.verifyPayment(pidx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Khalti verification failed: ${message}` }, { status: 400 });
  }

  if (verificationResult.status !== "succeeded") {
    // Not a successful payment — acknowledge receipt but take no order action.
    return NextResponse.json({ received: true, status: verificationResult.status });
  }

  // Idempotency: record the event keyed on (provider, pidx).
  try {
    await prisma.webhookEvent.create({
      data: { provider: "khalti", eventId: pidx, eventType: "payment.success", rawBody, status: "processing" },
    });
  } catch {
    // Unique constraint violation — already processed.
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Find and fulfill the order linked to this pidx.
  const order = await prisma.order.findFirst({
    where: { paymentIntentId: pidx, status: { in: ["pending", "processing"] } },
  });
  if (order) {
    await prisma.order.updateMany({
      where: { id: order.id, status: { in: ["pending", "processing"] } },
      data: { status: "paid" },
    });
  }

  await prisma.webhookEvent.updateMany({
    where: { provider: "khalti", eventId: pidx },
    data: { status: "processed", processedAt: new Date() },
  });

  return NextResponse.json({ received: true });
}
