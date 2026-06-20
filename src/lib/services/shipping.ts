import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FlatRateProvider } from "@/lib/shipping/flat-rate";
import { WeightBasedProvider } from "@/lib/shipping/weight-based";
import { PriceBasedProvider } from "@/lib/shipping/price-based";
import { FreeShippingProvider } from "@/lib/shipping/free-shipping";
import type { ShippingAddress, ShippingItem, ShippingOption } from "@/lib/shipping/provider";

const providers: Record<string, FlatRateProvider | WeightBasedProvider | PriceBasedProvider | FreeShippingProvider> = {
  flat: new FlatRateProvider(),
  weight_based: new WeightBasedProvider(),
  price_based: new PriceBasedProvider(),
  free: new FreeShippingProvider(),
};

// ── Zones ────────────────────────────────────────────

export async function listZones(tenantId: string) {
  return prisma.shippingZone.findMany({
    where: { tenantId },
    include: { rates: { include: { method: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getZone(id: string, tenantId: string) {
  return prisma.shippingZone.findFirst({
    where: { id, tenantId },
    include: { rates: { include: { method: true } } },
  });
}

export async function createZone(tenantId: string, data: {
  name: string;
  countries: string[];
  states: string[];
  regions: string[];
  zipCodes: string[];
  zipRanges?: { start: string; end: string }[];
}) {
  return prisma.shippingZone.create({
    data: {
      tenantId,
      name: data.name,
      countries: data.countries,
      states: data.states,
      regions: data.regions,
      zipCodes: data.zipCodes,
      zipRanges: data.zipRanges as Prisma.InputJsonValue,
    },
    include: { rates: { include: { method: true } } },
  });
}

export async function updateZone(id: string, tenantId: string, data: {
  name?: string;
  countries?: string[];
  states?: string[];
  regions?: string[];
  zipCodes?: string[];
  zipRanges?: { start: string; end: string }[] | null;
}) {
  return prisma.shippingZone.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.countries !== undefined ? { countries: data.countries } : {}),
      ...(data.states !== undefined ? { states: data.states } : {}),
      ...(data.regions !== undefined ? { regions: data.regions } : {}),
      ...(data.zipCodes !== undefined ? { zipCodes: data.zipCodes } : {}),
      ...(data.zipRanges !== undefined ? { zipRanges: data.zipRanges as Prisma.InputJsonValue } : {}),
    },
    include: { rates: { include: { method: true } } },
  });
}

export async function deleteZone(id: string, tenantId: string) {
  const zone = await prisma.shippingZone.findFirst({ where: { id, tenantId } });
  if (!zone) throw new Error("Shipping zone not found");
  await prisma.shippingZone.delete({ where: { id } });
}

// ── Methods ──────────────────────────────────────────

export async function listMethods(tenantId: string) {
  return prisma.shippingMethod.findMany({
    where: { tenantId },
    include: { rates: { include: { zone: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getMethod(id: string, tenantId: string) {
  return prisma.shippingMethod.findFirst({
    where: { id, tenantId },
    include: { rates: { include: { zone: true } } },
  });
}

export async function createMethod(tenantId: string, data: {
  name: string;
  type: string;
  configuration: Record<string, unknown>;
  carrier?: string;
  carrierConfig?: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return prisma.shippingMethod.create({
    data: {
      tenantId,
      name: data.name,
      type: data.type,
      configuration: data.configuration as Prisma.InputJsonValue,
      carrier: data.carrier ?? null,
      carrierConfig: (data.carrierConfig ?? null) as Prisma.InputJsonValue,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
    include: { rates: { include: { zone: true } } },
  });
}

export async function updateMethod(id: string, tenantId: string, data: {
  name?: string;
  type?: string;
  configuration?: Record<string, unknown>;
  carrier?: string | null;
  carrierConfig?: Record<string, unknown> | null;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const method = await prisma.shippingMethod.findFirst({ where: { id, tenantId } });
  if (!method) throw new Error("Shipping method not found");

  return prisma.shippingMethod.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.configuration !== undefined ? { configuration: data.configuration as Prisma.InputJsonValue } : {}),
      ...(data.carrier !== undefined ? { carrier: data.carrier } : {}),
      ...(data.carrierConfig !== undefined ? { carrierConfig: data.carrierConfig as Prisma.InputJsonValue } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
    include: { rates: { include: { zone: true } } },
  });
}

export async function deleteMethod(id: string, tenantId: string) {
  const method = await prisma.shippingMethod.findFirst({ where: { id, tenantId } });
  if (!method) throw new Error("Shipping method not found");
  await prisma.shippingMethod.delete({ where: { id } });
}

// ── Rates ────────────────────────────────────────────

export async function setRate(zoneId: string, methodId: string, price: number) {
  return prisma.shippingRate.upsert({
    where: { zoneId_methodId: { zoneId, methodId } },
    create: { zoneId, methodId, price },
    update: { price },
  });
}

export async function deleteRate(zoneId: string, methodId: string) {
  await prisma.shippingRate.deleteMany({
    where: { zoneId, methodId },
  });
}

// ── Address matching ─────────────────────────────────

function addressMatchesZone(address: ShippingAddress, zone: {
  countries: string[];
  states: string[];
  regions: string[];
  zipCodes: string[];
  zipRanges: { start: string; end: string }[] | null;
}): boolean {
  if (zone.countries.length > 0 && !zone.countries.includes(address.country)) {
    return false;
  }

  if (zone.states.length > 0 && address.state) {
    if (!zone.states.includes(address.state)) return false;
  }

  if (zone.regions.length > 0 && address.city) {
    const regionMatch = zone.regions.some((r) =>
      address.city!.toLowerCase().includes(r.toLowerCase()),
    );
    if (!regionMatch) return false;
  }

  if (zone.zipCodes.length > 0 && address.zip) {
    if (!zone.zipCodes.includes(address.zip)) return false;
  }

  if (zone.zipRanges && zone.zipRanges.length > 0 && address.zip) {
    const zipNum = parseInt(address.zip, 10);
    if (isNaN(zipNum)) return false;
    const inRange = zone.zipRanges.some((r) => {
      const start = parseInt(r.start, 10);
      const end = parseInt(r.end, 10);
      return zipNum >= start && zipNum <= end;
    });
    if (!inRange) return false;
  }

  return true;
}

// ── Calculation ──────────────────────────────────────

export async function calculateShipping(
  tenantId: string,
  address: ShippingAddress,
  items: ShippingItem[],
): Promise<ShippingOption[]> {
  const zones = await prisma.shippingZone.findMany({
    where: { tenantId },
    include: {
      rates: {
        include: { method: true },
      },
    },
  });

  const matchingZones = zones.filter((z) => addressMatchesZone(address, z as Parameters<typeof addressMatchesZone>[1]));
  if (matchingZones.length === 0) return [];

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const options: ShippingOption[] = [];

  for (const zone of matchingZones) {
    for (const rate of zone.rates) {
      if (!rate.method.isActive) continue;

      const provider = providers[rate.method.type];
      if (!provider) continue;

      const methodOptions = await provider.calculate(
        { address, items, subtotal },
        rate.method.configuration as Record<string, unknown>,
      );

      for (const opt of methodOptions) {
        options.push({
          ...opt,
          methodId: rate.method.id,
          methodName: rate.method.name,
          price: Number(rate.price),
        });
      }
    }
  }

  options.sort((a, b) => a.price - b.price);
  return options;
}
