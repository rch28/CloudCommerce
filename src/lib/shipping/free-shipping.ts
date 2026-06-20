import type { ShippingProvider, ShippingOption, CalculateParams } from "./provider";

export class FreeShippingProvider implements ShippingProvider {
  async calculate(_params: CalculateParams, _config: Record<string, unknown>): Promise<ShippingOption[]> {
    return [{
      methodId: "free",
      methodName: "Free Shipping",
      carrier: null,
      type: "free",
      price: 0,
      estimatedDaysMin: 7,
      estimatedDaysMax: 14,
    }];
  }
}
