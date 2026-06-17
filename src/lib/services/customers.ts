import { prisma } from "@/lib/prisma";
import { customerSchema, type CustomerInput } from "@/lib/schemas";

const mockCustomers: Array<{ id: string; email: string; name: string; phone: string | null; tenantId: string; createdAt: Date; updatedAt: Date }> = [];

export async function listCustomers(tenantId: string) {
  if (process.env.DATABASE_URL) {
    return prisma.customer.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  return mockCustomers.filter((c) => c.tenantId === tenantId);
}

export async function getCustomer(id: string) {
  if (process.env.DATABASE_URL) return prisma.customer.findUnique({ where: { id } });
  return mockCustomers.find((c) => c.id === id) ?? null;
}

export async function getCustomerByEmail(email: string, tenantId: string) {
  if (process.env.DATABASE_URL) {
    return prisma.customer.findUnique({ where: { email_tenantId: { email, tenantId } } });
  }
  return mockCustomers.find((c) => c.email === email && c.tenantId === tenantId) ?? null;
}

export async function createCustomer(data: CustomerInput, tenantId: string) {
  const parsed = customerSchema.parse(data);
  if (process.env.DATABASE_URL) {
    return prisma.customer.create({ data: { ...parsed, phone: parsed.phone ?? null, tenantId } });
  }
  const customer = { id: `cust-${Date.now()}`, ...parsed, phone: parsed.phone ?? null, tenantId, createdAt: new Date(), updatedAt: new Date() };
  mockCustomers.push(customer as typeof mockCustomers[0]);
  return customer;
}

export async function updateCustomer(id: string, data: Partial<CustomerInput>) {
  const parsed = customerSchema.partial().parse(data);
  if (process.env.DATABASE_URL) return prisma.customer.update({ where: { id }, data: parsed });
  const idx = mockCustomers.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Customer not found");
  Object.assign(mockCustomers[idx], parsed, { updatedAt: new Date() });
  return mockCustomers[idx];
}
