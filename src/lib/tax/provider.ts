export interface TaxLine {
  name: string;
  rate: number;
  amount: number;
  type: "percentage" | "compound";
}

export interface CalculateTaxInput {
  amount: number;
  shipping: number;
  origin: { country: string; state?: string; zip?: string };
  destination: { country: string; state?: string; zip?: string; city?: string };
  items?: Array<{ id: string; quantity: number; price: number; taxCode?: string }>;
}

export interface CalculateTaxResult {
  taxLines: TaxLine[];
  totalTax: number;
  breakdown?: Record<string, unknown>;
}

export interface TaxProvider {
  name: string;
  calculate(input: CalculateTaxInput): Promise<CalculateTaxResult>;
  validateAddress(address: { country: string; state?: string; zip?: string; city?: string }): Promise<{ valid: boolean; normalized?: typeof address }>;
}
