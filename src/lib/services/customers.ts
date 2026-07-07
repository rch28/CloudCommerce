import { prisma } from "@/lib/prisma";
import { customerSchema, type CustomerInput } from "@/lib/schemas";

const mockCustomers: Array<{ id: string; email: string; name: string; phone: string | null; tenantId: string; createdAt: Date; updatedAt: Date }> = [];

export async function listCustomers(tenantId: string) {
  if (process.env.DATABASE_URL) {
    return prisma.customer.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  return mockCustomers.filter((c) => c.tenantId === tenantId);
}

export async function listMerchantCustomers(
  tenantId: string,
  opts: { search?: string; page?: number; limit?: number },
) {
  const { search = "", page = 1, limit = 20 } = opts;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenantId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (process.env.DATABASE_URL) {
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { orders: true } },
          orders: { select: { total: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers: customers.map(({ _count, orders, ...c }) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        orderCount: _count.orders,
        totalSpent: orders.reduce((sum, o) => sum + Number(o.total), 0),
        joined: c.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const filtered = mockCustomers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    }
    return true;
  });
  const paginated = filtered.slice(skip, skip + limit);
  return {
    customers: paginated.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      orderCount: 0,
      totalSpent: 0,
      joined: c.createdAt.toISOString(),
    })),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export async function getCustomer(id: string, tenantId?: string) {
  if (process.env.DATABASE_URL) {
    const where: Record<string, unknown> = { id };
    if (tenantId) where.tenantId = tenantId;
    const customer = await prisma.customer.findFirst({
      where,
      include: {
        _count: { select: { orders: true } },
        orders: { select: { total: true } },
      },
    });
    if (!customer) return null;
    const { _count, orders, ...c } = customer;
    return {
      ...c,
      orderCount: _count.orders,
      totalSpent: orders.reduce((sum, o) => sum + Number(o.total), 0),
    };
  }
  return mockCustomers.find((c) => c.id === id && (!tenantId || c.tenantId === tenantId)) ?? null;
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

export async function updateCustomer(id: string, data: Partial<CustomerInput>, tenantId?: string) {
  const parsed = customerSchema.partial().parse(data);
  if (process.env.DATABASE_URL) {
    if (tenantId) {
      const existing = await prisma.customer.findFirst({ where: { id, tenantId } });
      if (!existing) throw new Error("Customer not found or access denied");
    }
    return prisma.customer.update({ where: { id }, data: parsed });
  }
  const idx = mockCustomers.findIndex((c) => c.id === id && (!tenantId || c.tenantId === tenantId));
  if (idx === -1) throw new Error("Customer not found or access denied");
  Object.assign(mockCustomers[idx], parsed, { updatedAt: new Date() });
  return mockCustomers[idx];
}
