export interface CreatePaymentInput {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
}

export interface PaymentResult {
  id: string;
  status: "succeeded" | "failed" | "pending";
  providerPaymentId: string;
  redirectUrl?: string;
  providerData?: Record<string, unknown>;
}

export interface RefundResult {
  status: "succeeded" | "failed";
  refundId: string;
}

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  verifyPayment(providerPaymentId: string): Promise<PaymentResult>;
  refundPayment(providerPaymentId: string, amount?: number): Promise<RefundResult>;
}
