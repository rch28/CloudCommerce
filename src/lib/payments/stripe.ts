import Stripe from "stripe";
import type { PaymentProvider, CreatePaymentInput, PaymentResult, RefundResult } from "./provider";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === "sk_test_mock") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("STRIPE_SECRET_KEY is required in production");
    }
    // Return a mock-shaped client for dev/test (never calls Stripe API).
    return null as unknown as Stripe;
  }
  return new Stripe(key);
}

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe | null;

  constructor() {
    this.stripe = getStripeClient();
  }

  private get isMock() {
    return this.stripe === null;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (this.isMock) {
      const { amount, currency = "usd", description, metadata, returnUrl } = input;
      const id = `pi_stripe_mock_${Date.now()}`;
      return { id, status: "pending", providerPaymentId: id, redirectUrl: returnUrl || `https://checkout.stripe.com/pay/${id}`, providerData: { amount, currency, description, metadata } };
    }

    const { amount, currency = "usd", description, metadata, returnUrl } = input;
    const intent = await this.stripe!.paymentIntents.create({
      amount: Math.round(amount * 100), // integer minor units (cents)
      currency,
      description,
      metadata: metadata as Record<string, string>,
    });
    return {
      id: intent.id,
      status: "pending",
      providerPaymentId: intent.id,
      redirectUrl: returnUrl ?? "",
      providerData: { clientSecret: intent.client_secret },
    };
  }

  async verifyPayment(providerPaymentId: string): Promise<PaymentResult> {
    if (this.isMock) {
      // In non-production only; never mock-succeed in production.
      return { id: providerPaymentId, status: "pending", providerPaymentId, providerData: { mock: true } };
    }
    const intent = await this.stripe!.paymentIntents.retrieve(providerPaymentId);
    const status =
      intent.status === "succeeded"
        ? "succeeded"
        : intent.status === "canceled"
          ? "failed"
          : "pending";
    return { id: intent.id, status, providerPaymentId: intent.id, providerData: { stripeStatus: intent.status, amount: intent.amount } };
  }

  async refundPayment(providerPaymentId: string, amount?: number): Promise<RefundResult> {
    if (this.isMock) {
      return { status: "succeeded", refundId: `ref_stripe_mock_${Date.now()}` };
    }
    const refund = await this.stripe!.refunds.create({
      payment_intent: providerPaymentId,
      ...(amount !== undefined ? { amount: Math.round(amount * 100) } : {}),
    });
    return { status: refund.status === "succeeded" ? "succeeded" : "failed", refundId: refund.id };
  }
}
