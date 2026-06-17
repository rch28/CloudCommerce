import type { PaymentProvider, CreatePaymentInput, PaymentResult, RefundResult } from "./provider";

export class ESewaProvider implements PaymentProvider {
  private merchantCode: string;

  constructor(merchantCode?: string) {
    this.merchantCode = merchantCode || process.env.ESEWA_MERCHANT_CODE || "ESEWA_TEST";
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const id = `pi_esewa_${Date.now()}`;
    return {
      id,
      status: "pending",
      providerPaymentId: id,
      redirectUrl: `https://esewa.com.np/epay/main?amt=${input.amount}&pid=${id}`,
      providerData: { amt: input.amount, txAmt: 0, psc: 0, pdc: 0, tAmt: input.amount, pid: id, scd: this.merchantCode },
    };
  }

  async verifyPayment(providerPaymentId: string): Promise<PaymentResult> {
    return {
      id: providerPaymentId,
      status: "succeeded",
      providerPaymentId,
      providerData: { refId: `ref_${providerPaymentId}`, verified: true },
    };
  }

  async refundPayment(providerPaymentId: string, amount?: number): Promise<RefundResult> {
    return { status: "succeeded", refundId: `ref_esewa_${Date.now()}` };
  }
}
