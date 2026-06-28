import type { PaymentProvider, CreatePaymentInput, PaymentResult, RefundResult } from "./provider";

const KHALTI_BASE = "https://khalti.com/api/v2";

export class KhaltiProvider implements PaymentProvider {
  private secretKey: string;
  private isMock: boolean;

  constructor(secretKey?: string) {
    const key = secretKey || process.env.KHALTI_SECRET_KEY || "";
    this.isMock = !key || key === "khalti_test_mock";
    if (this.isMock && process.env.NODE_ENV === "production") {
      throw new Error("KHALTI_SECRET_KEY is required in production");
    }
    this.secretKey = key;
  }

  private get headers() {
    return { Authorization: `Key ${this.secretKey}`, "Content-Type": "application/json" };
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (this.isMock) {
      const id = `pi_khalti_mock_${Date.now()}`;
      return { id, status: "pending", providerPaymentId: id, redirectUrl: `https://khalti.com/pay/${id}`, providerData: { amount: input.amount * 100, currency: "NPR" } };
    }
    const res = await fetch(`${KHALTI_BASE}/epayment/initiate/`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        return_url: input.returnUrl,
        website_url: process.env.NEXT_PUBLIC_APP_URL ?? "",
        amount: Math.round(input.amount * 100), // paisa
        purchase_order_id: input.metadata?.orderId ?? `order_${Date.now()}`,
        purchase_order_name: input.description ?? "Order",
      }),
    });
    if (!res.ok) throw new Error(`Khalti initiate failed: ${res.status}`);
    const data = await res.json();
    return { id: data.pidx, status: "pending", providerPaymentId: data.pidx, redirectUrl: data.payment_url, providerData: data };
  }

  async verifyPayment(providerPaymentId: string): Promise<PaymentResult> {
    if (this.isMock) {
      return { id: providerPaymentId, status: "pending", providerPaymentId, providerData: { mock: true } };
    }
    const res = await fetch(`${KHALTI_BASE}/epayment/lookup/`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ pidx: providerPaymentId }),
    });
    if (!res.ok) throw new Error(`Khalti lookup failed: ${res.status}`);
    const data = await res.json();
    const status = data.status === "Completed" ? "succeeded" : data.status === "Refunded" ? "failed" : "pending";
    return { id: data.pidx, status, providerPaymentId: data.pidx, providerData: data };
  }

  async refundPayment(_providerPaymentId: string, _amount?: number): Promise<RefundResult> {
    // Khalti does not have a programmatic refund API — refunds are done via dashboard.
    throw new Error("Khalti refunds must be processed through the Khalti merchant dashboard");
  }
}
