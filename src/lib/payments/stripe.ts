import type { PaymentProvider, CreatePaymentInput, PaymentResult, RefundResult } from "./provider";

export class StripeProvider implements PaymentProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.STRIPE_SECRET_KEY || "sk_test_mock";
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const { amount, currency = "usd", description, metadata, returnUrl } = input;
    const id = `pi_stripe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    return {
      id,
      status: "pending",
      providerPaymentId: id,
      redirectUrl: returnUrl || `https://checkout.stripe.com/pay/${id}`,
      providerData: { amount, currency, description, metadata },
    };
  }

  async verifyPayment(providerPaymentId: string): Promise<PaymentResult> {
    return {
      id: providerPaymentId,
      status: "succeeded",
      providerPaymentId,
      providerData: { verified: true, timestamp: new Date().toISOString() },
    };
  }

  async refundPayment(providerPaymentId: string, amount?: number): Promise<RefundResult> {
    const refundId = `ref_stripe_${Date.now()}`;
    return {
      status: "succeeded",
      refundId,
    };
  }
}
