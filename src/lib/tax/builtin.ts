import { getPrisma } from "@/lib/prisma";
import type { TaxProvider, CalculateTaxInput, CalculateTaxResult, TaxLine } from "./provider";

export class BuiltinTaxProvider implements TaxProvider {
  name = "builtin";

  async calculate(input: CalculateTaxInput): Promise<CalculateTaxResult> {
    const prisma = getPrisma();
    const zones = await prisma.taxZone.findMany({
      where: { isActive: true },
      include: { rates: { where: { isActive: true }, orderBy: { priority: "asc" } } },
    });

    const matchingZones = zones.filter((z) => this.zoneMatches(z, input.destination));
    if (matchingZones.length === 0) return { taxLines: [], totalTax: 0 };

    const taxLines: TaxLine[] = [];
    const subtotal = input.amount;

    for (const zone of matchingZones) {
      for (const rate of zone.rates) {
        if (rate.startsAt && new Date(rate.startsAt) > new Date()) continue;
        if (rate.endsAt && new Date(rate.endsAt) < new Date()) continue;

        const rateNum = Number(rate.rate);
        if (rate.type === "percentage") {
          const amount = Math.round(subtotal * rateNum * 100) / 100;
          taxLines.push({ name: rate.name, rate: rateNum, amount, type: "percentage" });
        } else if (rate.type === "compound") {
          const taxableBase = subtotal + taxLines.reduce((s, t) => s + t.amount, 0);
          const amount = Math.round(taxableBase * rateNum * 100) / 100;
          taxLines.push({ name: rate.name, rate: rateNum, amount, type: "compound" });
        }
      }
    }

    const totalTax = Math.round(taxLines.reduce((s, t) => s + t.amount, 0) * 100) / 100;
    return { taxLines, totalTax };
  }

  async validateAddress(address: { country: string; state?: string; zip?: string; city?: string }): Promise<{ valid: boolean; normalized?: typeof address }> {
    return { valid: true, normalized: address };
  }

  private zoneMatches(zone: { type: string; country: string; state?: string | null; region?: string | null; zipCodes: string[] }, destination: { country: string; state?: string; zip?: string; city?: string }): boolean {
    if (zone.country !== destination.country) return false;
    if (zone.type === "state" && zone.state && zone.state !== destination.state) return false;
    if (zone.type === "region" && zone.region && destination.city && !destination.city.toLowerCase().includes(zone.region.toLowerCase())) return false;
    if (zone.zipCodes.length > 0 && destination.zip && !zone.zipCodes.includes(destination.zip)) return false;
    return true;
  }
}
