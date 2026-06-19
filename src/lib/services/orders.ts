import { prisma } from "@/lib/prisma";
import { orderSchema, type OrderInput } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";
import { isValidTransition } from "@/data/order-status";
import { sendEmail } from "@/lib/email";
import { OrderEventPublisher } from "@/lib/redis-pubsub";

interface OrderAddressData {
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface CheckoutParams {
  customerId: string | null;
  sessionId: string | null;
  tenantId: string;
  addressId?: string;
  address?: Omit<OrderAddressData, "id" | "orderId">;
  notes?: string;
}

interface OrderResult {
  id: string;
  number: string;
  customerId: string | null;
  tenantId: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    variantId: string;
    productName: string;
    sku: string;
    price: number;
    quantity: number;
    image: string | null;
  }>;
  address: OrderAddressData | null;
}

async function generateOrderNumber(): Promise<string> {
  const lastOrder = await prisma.order.findFirst({
    where: { number: { startsWith: "CC-" } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastNum = lastOrder ? parseInt(lastOrder.number.slice(3), 10) : 0;
  return `CC-${String(lastNum + 1).padStart(5, "0")}`;
}

export async function checkout(params: CheckoutParams): Promise<OrderResult> {
  const { customerId, sessionId, tenantId, addressId, address: inlineAddress, notes } = params;

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
      where: customerId
        ? { customerId, tenantId }
        : { sessionId, tenantId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: { select: { url: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    for (const item of cart.items) {
      const variant = item.variant;
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);
      if (variant.status !== "active") {
        throw new Error(`${variant.product?.name ?? "Product"} is no longer available`);
      }
      if (variant.quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${variant.product?.name ?? "product"}: ${variant.quantity} available, ${item.quantity} requested`,
        );
      }
    }

    let resolvedAddress: OrderAddressData;

    if (addressId) {
      const savedAddress = await tx.address.findUnique({ where: { id: addressId } });
      if (!savedAddress) throw new Error("Address not found");
      resolvedAddress = {
        label: savedAddress.label,
        line1: savedAddress.line1,
        line2: savedAddress.line2,
        city: savedAddress.city,
        state: savedAddress.state,
        zip: savedAddress.zip,
        country: savedAddress.country,
      };
    } else if (inlineAddress) {
      resolvedAddress = {
        label: inlineAddress.label,
        line1: inlineAddress.line1,
        line2: inlineAddress.line2 ?? null,
        city: inlineAddress.city,
        state: inlineAddress.state,
        zip: inlineAddress.zip,
        country: inlineAddress.country,
      };
    } else {
      throw new Error("Shipping address is required");
    }

    const orderNumber = await generateOrderNumber();
    const subtotal = cart.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    const shipping = subtotal >= 100 ? 0 : 10;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const order = await tx.order.create({
      data: {
        number: orderNumber,
        customerId,
        tenantId,
        status: "confirmed",
        subtotal,
        shipping,
        tax,
        total,
        notes: notes ?? null,
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            productName: item.variant?.product?.name ?? "",
            sku: item.variant?.sku ?? "",
            price: Number(item.price),
            quantity: item.quantity,
            image: item.variant?.product?.images?.[0]?.url ?? null,
          })),
        },
        address: { create: resolvedAddress },
      },
      include: { items: true, address: true },
    });

    for (const item of cart.items) {
      const result = await tx.$queryRawUnsafe<Array<{ quantity: number }>>(
        `UPDATE "ProductVariant" SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1 RETURNING quantity`,
        item.quantity,
        item.variantId,
      );
      if (result.length === 0) {
        throw new Error(
          `Stock depleted for ${item.variant?.product?.name ?? "product"} during checkout`,
        );
      }
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.delete({ where: { id: cart.id } });

    await logAudit({
      entityType: "order",
      entityId: order.id,
      action: "created",
      changes: { number: orderNumber, total, items: cart.items.length },
      tenantId,
    }).catch(() => {});

    OrderEventPublisher.publish(tenantId, {
      event: "order.created",
      data: {
        id: order.id,
        number: order.number,
        status: order.status,
        total: Number(order.total),
        customerName: "",
        itemCount: cart.items.length,
        tenantId,
      },
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return {
      id: order.id,
      number: order.number,
      customerId: order.customerId,
      tenantId: order.tenantId,
      status: order.status,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      total: Number(order.total),
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        id: i.id,
        variantId: i.variantId,
        productName: i.productName,
        sku: i.sku,
        price: Number(i.price),
        quantity: i.quantity,
        image: i.image,
      })),
      address: order.address
        ? {
            label: order.address.label,
            line1: order.address.line1,
            line2: order.address.line2,
            city: order.address.city,
            state: order.address.state,
            zip: order.address.zip,
            country: order.address.country,
          }
        : null,
    };
  });
}

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
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

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
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

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

export async function listMerchantOrders(
  tenantId: string,
  opts: { search?: string; status?: string; page?: number; limit?: number; customerId?: string },
) {
  const { search = "", status = "all", page = 1, limit = 20, customerId } = opts;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenantId };
  if (customerId) where.customerId = customerId;
  if (status && status !== "all") where.status = status;

  if (search) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          ...where,
          OR: [
            { number: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
            { customer: { email: { contains: search, mode: "insensitive" } } },
          ],
        },
        include: {
          customer: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: {
          ...where,
          OR: [
            { number: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
            { customer: { email: { contains: search, mode: "insensitive" } } },
          ],
        },
      }),
    ]);

    return {
      orders: orders.map(({ _count, ...o }) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        customerName: o.customer?.name ?? "",
        customerEmail: o.customer?.email ?? "",
        itemCount: _count.items,
        total: Number(o.total),
        createdAt: o.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(({ _count, ...o }) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      customerName: o.customer?.name ?? "",
      customerEmail: o.customer?.email ?? "",
      itemCount: _count.items,
      total: Number(o.total),
      createdAt: o.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrderDetail(id: string, tenantId: string) {
  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          variant: { select: { sku: true, price: true, quantity: true } },
        },
      },
      address: true,
    },
  });

  if (!order) return null;

  const timeline = await prisma.auditLog.findMany({
    where: { entityType: "order", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    tax: Number(order.tax),
    total: Number(order.total),
    notes: order.notes,
    stripeSessionId: order.stripeSessionId,
    paymentIntentId: order.paymentIntentId,
    chargeId: order.chargeId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: order.customer,
    items: order.items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      productName: i.productName,
      sku: i.sku,
      price: Number(i.price),
      quantity: i.quantity,
      image: i.image,
    })),
    address: order.address
      ? {
          label: order.address.label,
          line1: order.address.line1,
          line2: order.address.line2,
          city: order.address.city,
          state: order.address.state,
          zip: order.address.zip,
          country: order.address.country,
        }
      : null,
    timeline: timeline.map((t) => ({
      id: t.id,
      action: t.action,
      changes: t.changes ? JSON.parse(t.changes) : null,
      createdAt: t.createdAt,
    })),
  };
}

export async function updateOrderStatusValidated(id: string, newStatus: string, tenantId: string, userId?: string) {
  const order = await prisma.order.findFirst({ where: { id, tenantId } });
  if (!order) throw new Error("Order not found");

  if (!isValidTransition(order.status, newStatus)) {
    throw new Error(`Cannot transition from "${order.status}" to "${newStatus}"`);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: newStatus },
    include: { customer: { select: { name: true, email: true } }, items: true },
  });

  await logAudit({
    entityType: "order",
    entityId: id,
    action: "updated",
    changes: { from: order.status, to: newStatus },
    userId,
    tenantId,
  });

  const eventPayload = {
    id: updated.id,
    number: updated.number,
    status: updated.status,
    total: Number(updated.total),
    customerName: updated.customer?.name ?? "",
    itemCount: updated.items.length,
    tenantId,
  };

  const eventMap: Record<string, "order.payment_received" | "order.shipped" | "order.cancelled"> = {
    paid: "order.payment_received",
    shipped: "order.shipped",
    cancelled: "order.cancelled",
  };

  const orderEvent = eventMap[newStatus];
  if (orderEvent) {
    OrderEventPublisher.publish(tenantId, {
      event: orderEvent,
      data: eventPayload,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }

  if (newStatus === "shipped" && updated.customer?.email) {
    sendEmail({
      type: "order_shipped",
      to: updated.customer.email,
      orderNumber: updated.number,
      customerName: updated.customer.name,
    }).catch(() => {});
  }

  if (newStatus === "delivered" && updated.customer?.email) {
    sendEmail({
      type: "order_delivered",
      to: updated.customer.email,
      orderNumber: updated.number,
      customerName: updated.customer.name,
    }).catch(() => {});
  }

  return updated;
}

export async function resendConfirmationEmail(orderId: string, tenantId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: { customer: { select: { name: true, email: true } } },
  });

  if (!order) throw new Error("Order not found");
  if (!order.customer?.email) throw new Error("Customer has no email address");

  await sendEmail({
    type: "order_confirmation",
    to: order.customer.email,
    orderNumber: order.number,
    customerName: order.customer.name,
    total: Number(order.total),
  });

  await logAudit({
    entityType: "order",
    entityId: orderId,
    action: "updated",
    changes: { emailResent: true },
    tenantId,
  });
}
