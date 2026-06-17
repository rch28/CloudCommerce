import { prisma } from "@/lib/prisma";
import { orderSchema, addressSchema, type OrderInput } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

let orderCounter = 1000;
const mockOrders: Array<{
  id: string; number: string; customerId: string | null; tenantId: string; status: string;
  subtotal: number; shipping: number; tax: number; total: number; notes: string | null;
  createdAt: Date; updatedAt: Date;
  items: Array<{ id: string; orderId: string; variantId: string; productName: string; sku: string; price: number; quantity: number; image: string | null }>;
  address: { id: string; orderId: string; label: string; line1: string; line2: string | null; city: string; state: string; zip: string; country: string } | null;
}> = [];

export async function listOrders(tenantId: string, customerId?: string) {
  if (process.env.DATABASE_URL) {
    const where: Record<string, unknown> = { tenantId };
    if (customerId) where.customerId = customerId;
    return prisma.order.findMany({ where, include: { items: true, address: true }, orderBy: { createdAt: "desc" } });
  }
  let result = mockOrders.filter((o) => o.tenantId === tenantId);
  if (customerId) result = result.filter((o) => o.customerId === customerId);
  return result;
}

export async function getOrder(id: string) {
  if (process.env.DATABASE_URL) {
    return prisma.order.findUnique({ where: { id }, include: { items: true, address: true } });
  }
  return mockOrders.find((o) => o.id === id) ?? null;
}

export async function createOrder(data: OrderInput, tenantId: string) {
  const parsed = orderSchema.parse(data);

  if (process.env.DATABASE_URL) {
    const orderNumber = `CC-${String(++orderCounter).padStart(5, "0")}`;
    const subtotal = parsed.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 10;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    const addressData = parsed.addressId
      ? undefined
      : parsed.address ? { ...parsed.address, line2: parsed.address.line2 ?? null } : undefined;

    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        customerId: parsed.customerId ?? null,
        tenantId,
        subtotal, shipping, tax, total,
        notes: parsed.notes ?? null,
        items: {
          create: parsed.items.map((item) => ({
            variantId: item.variantId,
            productName: "",
            sku: "",
            price: item.price,
            quantity: item.quantity,
          })),
        },
        ...(addressData ? { address: { create: addressData } } : {}),
      },
      include: { items: true, address: true },
    });

    for (const item of parsed.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    return order;
  }

  const orderNumber = `CC-${String(++orderCounter).padStart(5, "0")}`;
  const subtotal = parsed.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const addrData = parsed.address ? { id: `oa-${Date.now()}`, orderId: `ord-${Date.now()}`, label: parsed.address.label || "Home", line1: parsed.address.line1, line2: parsed.address.line2 ?? null, city: parsed.address.city, state: parsed.address.state, zip: parsed.address.zip, country: parsed.address.country || "US" } : null;

  const order = {
    id: `ord-${Date.now()}`, number: orderNumber, customerId: parsed.customerId ?? null,
    tenantId, status: "pending", subtotal, shipping, tax, total,
    notes: parsed.notes ?? null, createdAt: new Date(), updatedAt: new Date(),
    items: parsed.items.map((item, i) => ({
      id: `oi-${Date.now()}-${i}`, orderId: `ord-${Date.now()}`, variantId: item.variantId,
      productName: "", sku: "", price: item.price, quantity: item.quantity, image: null,
    })),
    address: addrData,
  };
  mockOrders.unshift(order as typeof mockOrders[0]);
  return order;
}

export async function updateOrderStatus(id: string, status: string, tenantId: string) {
  if (process.env.DATABASE_URL) {
    const order = await prisma.order.update({ where: { id }, data: { status }, include: { items: true } });
    await logAudit({ entityType: "order", entityId: id, action: "updated", changes: { status }, tenantId });
    return order;
  }
  const idx = mockOrders.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error("Order not found");
  mockOrders[idx].status = status;
  return mockOrders[idx];
}
