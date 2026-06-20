import type { TaxProvider, CalculateTaxInput, CalculateTaxResult } from "./provider";

export class TaxJarProvider implements TaxProvider {
  name = "taxjar";

  async calculate(input: CalculateTaxInput): Promise<CalculateTaxResult> {
    void input;
    throw new Error("TaxJar provider not configured");
  }

  async validateAddress(address: { country: string; state?: string; zip?: string; city?: string }): Promise<{ valid: boolean; normalized?: { country: string; state?: string; zip?: string; city?: string } }> {
    void address;
    throw new Error("TaxJar provider not configured");
  }
}
