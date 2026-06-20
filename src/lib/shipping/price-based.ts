import type { ShippingProvider, ShippingOption, CalculateParams } from "./provider";

export class PriceBasedProvider implements ShippingProvider {
  async calculate(params: CalculateParams, config: Record<string, unknown>): Promise<ShippingOption[]> {
    const subtotal = params.subtotal;
    const minOrder = Number(config.minOrder) || 0;
    const maxOrder = config.maxOrder !== undefined ? Number(config.maxOrder) : Infinity;

    if (subtotal < minOrder) {
      return [];
    }
    if (subtotal > maxOrder) {
      return [];
    }

    const rate = Number(config.rate) || 0;
    return [{
      methodId: "price_based",
      methodName: "Order Based Shipping",
      carrier: null,
      type: "price_based",
      price: rate,
      estimatedDaysMin: 5,
      estimatedDaysMax: 10,
    }];
  }
}
