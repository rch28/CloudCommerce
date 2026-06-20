import type { TaxProvider, CalculateTaxInput, CalculateTaxResult } from "./provider";

export class AvalaraProvider implements TaxProvider {
  name = "avalara";

  async calculate(input: CalculateTaxInput): Promise<CalculateTaxResult> {
    void input;
    throw new Error("Avalara provider not configured");
  }

  async validateAddress(address: { country: string; state?: string; zip?: string; city?: string }): Promise<{ valid: boolean; normalized?: { country: string; state?: string; zip?: string; city?: string } }> {
    void address;
    throw new Error("Avalara provider not configured");
  }
}
