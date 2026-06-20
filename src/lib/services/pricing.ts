export interface PricingInput {
  price: number;
  quantity: number;
}

export interface PricingResult {
  subtotal: number;
  discounts: number;
  shipping: number;
  tax: number;
  total: number;
}

const TAX_RATE = 0.08;

export function calculatePricing(items: PricingInput[], shipping = 0): PricingResult {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discounts = 0;
  const tax = Math.round((subtotal - discounts) * TAX_RATE * 100) / 100;
  const total = Math.max(0, subtotal - discounts + shipping + tax);

  return { subtotal, discounts, shipping, tax, total };
}
