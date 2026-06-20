import type { ShippingProvider, ShippingOption, CalculateParams } from "./provider";

export class WeightBasedProvider implements ShippingProvider {
  async calculate(params: CalculateParams, config: Record<string, unknown>): Promise<ShippingOption[]> {
    const rate = Number(config.rate) || 0;
    const totalWeight = params.items.reduce((sum, i) => sum + (i.weight ?? 0) * i.quantity, 0);
    return [{
      methodId: "weight_based",
      methodName: "Weight Based Shipping",
      carrier: null,
      type: "weight_based",
      price: totalWeight * rate,
      estimatedDaysMin: 5,
      estimatedDaysMax: 10,
    }];
  }
}
