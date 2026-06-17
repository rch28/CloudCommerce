import type { PaymentProvider, CreatePaymentInput, PaymentResult, RefundResult } from "./provider";

export class KhaltiProvider implements PaymentProvider {
  private secretKey: string;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.KHALTI_SECRET_KEY || "khalti_test_mock";
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const id = `pi_khalti_${Date.now()}`;
    return {
      id,
      status: "pending",
      providerPaymentId: id,
      redirectUrl: `https://khalti.com/pay/${id}`,
      providerData: { amount: input.amount * 100, currency: "NPR", productName: input.description },
    };
  }

  async verifyPayment(providerPaymentId: string): Promise<PaymentResult> {
    return {
      id: providerPaymentId,
      status: "succeeded",
      providerPaymentId,
      providerData: { verified: true, idx: providerPaymentId, state: "Completed" },
    };
  }

  async refundPayment(providerPaymentId: string, amount?: number): Promise<RefundResult> {
    return { status: "succeeded", refundId: `ref_khalti_${Date.now()}` };
  }
}
