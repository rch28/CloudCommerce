import type { TaxProvider } from "./provider";
import { BuiltinTaxProvider } from "./builtin";
import { TaxJarProvider } from "./taxjar";
import { AvalaraProvider } from "./avalara";

export function getTaxProvider(name?: string): TaxProvider {
  const provider = name || process.env.TAX_PROVIDER || "builtin";
  switch (provider) {
    case "builtin": return new BuiltinTaxProvider();
    case "taxjar": return new TaxJarProvider();
    case "avalara": return new AvalaraProvider();
    default: throw new Error(`Unknown tax provider: ${provider}`);
  }
}

export type { TaxProvider, TaxLine, CalculateTaxInput, CalculateTaxResult } from "./provider";
