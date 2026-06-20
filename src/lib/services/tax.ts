import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { taxZoneSchema, taxRateSchema } from "@/lib/schemas";
import { getTaxProvider } from "@/lib/tax";
import type { CalculateTaxInput } from "@/lib/tax";

export async function getTaxZones(tenantId: string, params: { page?: number; pageSize?: number; search?: string } = {}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { tenantId };
  if (params.search) {
    where.name = { contains: params.search, mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.taxZone.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { rates: true },
    }),
    prisma.taxZone.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTaxZone(tenantId: string, id: string) {
  return prisma.taxZone.findFirst({
    where: { id, tenantId },
    include: { rates: true },
  });
}

export async function createTaxZone(tenantId: string, data: unknown, meta: { userId?: string }) {
  const parsed = taxZoneSchema.parse(data);
  const zone = await prisma.taxZone.create({
    data: { tenantId, ...parsed, state: parsed.state ?? null, region: parsed.region ?? null },
    include: { rates: true },
  });
  await logAudit({
    entityType: "tax_zone",
    entityId: zone.id,
    action: "created",
    changes: { name: zone.name, type: zone.type },
    userId: meta.userId,
    tenantId,
  });
  return zone;
}

export async function updateTaxZone(tenantId: string, id: string, data: unknown, meta: { userId?: string }) {
  const existing = await prisma.taxZone.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Tax zone not found");

  const parsed = taxZoneSchema.partial().parse(data);
  const zone = await prisma.taxZone.update({
    where: { id },
    data: {
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.type !== undefined ? { type: parsed.type } : {}),
      ...(parsed.country !== undefined ? { country: parsed.country } : {}),
      ...(parsed.state !== undefined ? { state: parsed.state ?? null } : {}),
      ...(parsed.region !== undefined ? { region: parsed.region ?? null } : {}),
      ...(parsed.zipCodes !== undefined ? { zipCodes: parsed.zipCodes } : {}),
      ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
    },
    include: { rates: true },
  });
  await logAudit({
    entityType: "tax_zone",
    entityId: id,
    action: "updated",
    changes: { name: zone.name },
    userId: meta.userId,
    tenantId,
  });
  return zone;
}

export async function deleteTaxZone(tenantId: string, id: string, meta: { userId?: string }) {
  const zone = await prisma.taxZone.findFirst({ where: { id, tenantId } });
  if (!zone) throw new Error("Tax zone not found");
  await prisma.taxZone.delete({ where: { id } });
  await logAudit({
    entityType: "tax_zone",
    entityId: id,
    action: "deleted",
    changes: { name: zone.name },
    userId: meta.userId,
    tenantId,
  });
}

export async function getTaxRates(tenantId: string, params: { page?: number; pageSize?: number; zoneId?: string } = {}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { tenantId };
  if (params.zoneId) where.zoneId = params.zoneId;

  const [items, total] = await Promise.all([
    prisma.taxRate.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: { zone: { select: { id: true, name: true } } },
    }),
    prisma.taxRate.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTaxRate(tenantId: string, id: string) {
  return prisma.taxRate.findFirst({
    where: { id, tenantId },
    include: { zone: { select: { id: true, name: true } } },
  });
}

export async function createTaxRate(tenantId: string, data: unknown, meta: { userId?: string }) {
  const parsed = taxRateSchema.parse(data);
  const zone = await prisma.taxZone.findFirst({ where: { id: parsed.zoneId, tenantId } });
  if (!zone) throw new Error("Tax zone not found");

  const rate = await prisma.taxRate.create({
    data: {
      tenantId,
      zoneId: parsed.zoneId,
      name: parsed.name,
      type: parsed.type,
      rate: parsed.rate,
      priority: parsed.priority,
      isActive: parsed.isActive,
      startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
      endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
    },
    include: { zone: { select: { id: true, name: true } } },
  });
  await logAudit({
    entityType: "tax_rate",
    entityId: rate.id,
    action: "created",
    changes: { name: rate.name, zoneId: parsed.zoneId, rate: Number(rate.rate) },
    userId: meta.userId,
    tenantId,
  });
  return rate;
}

export async function updateTaxRate(tenantId: string, id: string, data: unknown, meta: { userId?: string }) {
  const existing = await prisma.taxRate.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Tax rate not found");

  const parsed = taxRateSchema.partial().parse(data);
  const rate = await prisma.taxRate.update({
    where: { id },
    data: {
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.type !== undefined ? { type: parsed.type } : {}),
      ...(parsed.rate !== undefined ? { rate: parsed.rate } : {}),
      ...(parsed.priority !== undefined ? { priority: parsed.priority } : {}),
      ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
      ...(parsed.startsAt !== undefined ? { startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null } : {}),
      ...(parsed.endsAt !== undefined ? { endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null } : {}),
      ...(parsed.zoneId !== undefined ? { zoneId: parsed.zoneId } : {}),
    },
    include: { zone: { select: { id: true, name: true } } },
  });
  await logAudit({
    entityType: "tax_rate",
    entityId: id,
    action: "updated",
    changes: { name: rate.name },
    userId: meta.userId,
    tenantId,
  });
  return rate;
}

export async function deleteTaxRate(tenantId: string, id: string, meta: { userId?: string }) {
  const rate = await prisma.taxRate.findFirst({ where: { id, tenantId } });
  if (!rate) throw new Error("Tax rate not found");
  await prisma.taxRate.delete({ where: { id } });
  await logAudit({
    entityType: "tax_rate",
    entityId: id,
    action: "deleted",
    changes: { name: rate.name },
    userId: meta.userId,
    tenantId,
  });
}

export async function calculateTax(tenantId: string, input: CalculateTaxInput) {
  const provider = getTaxProvider();
  return provider.calculate(input);
}
