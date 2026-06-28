import type { PaymentProvider, CreatePaymentInput, PaymentResult, RefundResult } from "./provider";

export class ESewaProvider implements PaymentProvider {
  private merchantCode: string;
  private secretKey: string;
  private isMock: boolean;

  constructor() {
    const code = process.env.ESEWA_MERCHANT_CODE || "";
    const secret = process.env.ESEWA_SECRET_KEY || "";
    this.isMock = !code || code === "ESEWA_TEST";
    if (this.isMock && process.env.NODE_ENV === "production") {
      throw new Error("ESEWA_MERCHANT_CODE and ESEWA_SECRET_KEY are required in production");
    }
    this.merchantCode = code || "EPAYTEST";
    this.secretKey = secret;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const id = `pi_esewa_${Date.now()}`;
    const amt = input.amount;
    const tAmt = amt;
    return {
      id,
      status: "pending",
      providerPaymentId: id,
      redirectUrl: `https://esewa.com.np/epay/main?amt=${amt}&txAmt=0&psc=0&pdc=0&tAmt=${tAmt}&pid=${id}&scd=${this.merchantCode}`,
      providerData: { amt, txAmt: 0, psc: 0, pdc: 0, tAmt, pid: id, scd: this.merchantCode },
    };
  }

  async verifyPayment(providerPaymentId: string): Promise<PaymentResult> {
    if (this.isMock) {
      return { id: providerPaymentId, status: "pending", providerPaymentId, providerData: { mock: true } };
    }
    // eSewa status check API (v2)
    const params = new URLSearchParams({ product_code: this.merchantCode, total_amount: "0", transaction_uuid: providerPaymentId });
    const res = await fetch(`https://esewa.com.np/api/epay/transaction/status/?${params}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`eSewa verification failed: ${res.status}`);
    const data = await res.json();
    const status = data.status === "COMPLETE" ? "succeeded" : data.status === "REFUNDED" ? "refunded" : "pending";
    return { id: providerPaymentId, status, providerPaymentId, providerData: data };
  }

  async refundPayment(_providerPaymentId: string, _amount?: number): Promise<RefundResult> {
    // eSewa does not expose a programmatic refund API — refunds via dashboard only.
    throw new Error("eSewa refunds must be processed through the eSewa merchant portal");
  }
}
