import type { ShippingProvider, ShippingOption, CalculateParams } from "./provider";

export class FlatRateProvider implements ShippingProvider {
  async calculate(params: CalculateParams, config: Record<string, unknown>): Promise<ShippingOption[]> {
    const rate = Number(config.rate) || 0;
    return [{
      methodId: "flat",
      methodName: "Flat Rate",
      carrier: null,
      type: "flat",
      price: rate,
      estimatedDaysMin: 5,
      estimatedDaysMax: 10,
    }];
  }
}
