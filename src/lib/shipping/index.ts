import type { CarrierProvider } from "./provider";

const carriers: Record<string, () => CarrierProvider> = {};

export function registerCarrier(name: string, factory: () => CarrierProvider) {
  carriers[name] = factory;
}

export function getCarrier(name: string): CarrierProvider {
  const factory = carriers[name];
  if (!factory) throw new Error(`Unknown shipping carrier: ${name}`);
  return factory();
}

export function getRegisteredCarriers(): string[] {
  return Object.keys(carriers);
}

export { FlatRateProvider } from "./flat-rate";
export { WeightBasedProvider } from "./weight-based";
export { PriceBasedProvider } from "./price-based";
export { FreeShippingProvider } from "./free-shipping";
