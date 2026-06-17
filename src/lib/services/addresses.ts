import { prisma } from "@/lib/prisma";
import { addressSchema, type AddressInput } from "@/lib/schemas";

const mockAddresses: Array<{ id: string; customerId: string; label: string; line1: string; line2: string | null; city: string; state: string; zip: string; country: string; isDefault: boolean; createdAt: Date; updatedAt: Date }> = [];

export async function listAddresses(customerId: string) {
  if (process.env.DATABASE_URL) {
    return prisma.address.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } });
  }
  return mockAddresses.filter((a) => a.customerId === customerId);
}

export async function getAddress(id: string) {
  if (process.env.DATABASE_URL) return prisma.address.findUnique({ where: { id } });
  return mockAddresses.find((a) => a.id === id) ?? null;
}

export async function createAddress(customerId: string, data: AddressInput) {
  const parsed = addressSchema.parse(data);
  if (process.env.DATABASE_URL) {
    if (parsed.isDefault) await prisma.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } });
    return prisma.address.create({ data: { ...parsed, line2: parsed.line2 ?? null, customerId } });
  }
  if (parsed.isDefault) mockAddresses.forEach((a) => { if (a.customerId === customerId) a.isDefault = false; });
  const addr = { id: `addr-${Date.now()}`, customerId, ...parsed, line2: parsed.line2 ?? null, createdAt: new Date(), updatedAt: new Date() };
  mockAddresses.push(addr as typeof mockAddresses[0]);
  return addr;
}

export async function updateAddress(id: string, data: Partial<AddressInput>) {
  const parsed = addressSchema.partial().parse(data);
  if (process.env.DATABASE_URL) return prisma.address.update({ where: { id }, data: parsed });
  const idx = mockAddresses.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error("Address not found");
  Object.assign(mockAddresses[idx], parsed, { updatedAt: new Date() });
  return mockAddresses[idx];
}

export async function deleteAddress(id: string) {
  if (process.env.DATABASE_URL) return prisma.address.delete({ where: { id } });
  const idx = mockAddresses.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error("Address not found");
  mockAddresses.splice(idx, 1);
  return { id };
}
