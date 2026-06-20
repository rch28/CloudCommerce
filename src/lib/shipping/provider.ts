export interface ShippingAddress {
  country: string;
  state: string;
  city?: string;
  zip?: string;
}

export interface ShippingItem {
  variantId: string;
  quantity: number;
  weight?: number;
  price: number;
}

export interface ShippingOption {
  methodId: string;
  methodName: string;
  carrier: string | null;
  type: string;
  price: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
}

export interface CalculateParams {
  address: ShippingAddress;
  items: ShippingItem[];
  subtotal: number;
}

export interface ShippingProvider {
  calculate(params: CalculateParams, config: Record<string, unknown>): Promise<ShippingOption[]>;
}

export interface CarrierProvider {
  name: string;
  calculate(params: CalculateParams, config: Record<string, unknown>): Promise<ShippingOption[]>;
}
