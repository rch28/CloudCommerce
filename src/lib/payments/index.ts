import type { PaymentProvider } from "./provider";
import { StripeProvider } from "./stripe";
import { KhaltiProvider } from "./khalti";
import { ESewaProvider } from "./esewa";

const providers: Record<string, () => PaymentProvider> = {
  stripe: () => new StripeProvider(),
  khalti: () => new KhaltiProvider(),
  esewa: () => new ESewaProvider(),
};

export function getProvider(name: string): PaymentProvider {
  const factory = providers[name];
  if (!factory) throw new Error(`Unknown payment provider: ${name}. Available: ${Object.keys(providers).join(", ")}`);
  return factory();
}

export type { PaymentProvider } from "./provider";
export type { CreatePaymentInput, PaymentResult, RefundResult } from "./provider";
