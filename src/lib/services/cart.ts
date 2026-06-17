import { prisma } from "@/lib/prisma";
import { products as mockProducts } from "@/data/mock";

interface CartItemData {
  variantId: string;
  quantity: number;
  price: number;
}

let mockCarts: Record<string, CartItemData[]> = {};

export async function getCart(tenantId: string, customerId?: string, sessionId?: string) {
  if (process.env.DATABASE_URL) {
    const cart = await prisma.cart.findFirst({
      where: { tenantId, ...(customerId ? { customerId } : { sessionId }) },
      include: { items: { include: { variant: { include: { product: { select: { name: true, images: true, slug: true } } } } } } },
    });
    return cart;
  }
  const key = customerId || sessionId || "guest";
  const items = mockCarts[key] || [];
  return { id: key, items, tenantId, customerId, sessionId };
}

export async function addToCart(tenantId: string, data: CartItemData, customerId?: string, sessionId?: string) {
  if (process.env.DATABASE_URL) {
    let cart = await prisma.cart.findFirst({ where: { tenantId, ...(customerId ? { customerId } : { sessionId }) } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { customerId: customerId ?? null, sessionId: sessionId ?? null, tenantId } });
    }
    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, variantId: data.variantId } });
    if (existing) {
      return prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + data.quantity } });
    }
    return prisma.cartItem.create({ data: { cartId: cart.id, variantId: data.variantId, quantity: data.quantity, price: data.price } });
  }
  const key = customerId || sessionId || "guest";
  if (!mockCarts[key]) mockCarts[key] = [];
  const existing = mockCarts[key].find((i) => i.variantId === data.variantId);
  if (existing) { existing.quantity += data.quantity; return existing; }
  mockCarts[key].push({ ...data });
  return data;
}

export async function updateCartItemQuantity(variantId: string, quantity: number, customerId?: string, sessionId?: string) {
  if (process.env.DATABASE_URL) {
    const cart = await prisma.cart.findFirst({ where: { ...(customerId ? { customerId } : { sessionId }) } });
    if (!cart) throw new Error("Cart not found");
    return prisma.cartItem.updateMany({ where: { cartId: cart.id, variantId }, data: { quantity } });
  }
  const key = customerId || sessionId || "guest";
  const item = (mockCarts[key] || []).find((i) => i.variantId === variantId);
  if (item) item.quantity = quantity;
  return { variantId, quantity };
}

export async function removeFromCart(variantId: string, customerId?: string, sessionId?: string) {
  if (process.env.DATABASE_URL) {
    const cart = await prisma.cart.findFirst({ where: { ...(customerId ? { customerId } : { sessionId }) } });
    if (!cart) throw new Error("Cart not found");
    return prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  }
  const key = customerId || sessionId || "guest";
  if (mockCarts[key]) mockCarts[key] = mockCarts[key].filter((i) => i.variantId !== variantId);
  return { variantId };
}

export async function clearCart(customerId?: string, sessionId?: string) {
  const key = customerId || sessionId || "guest";
  if (process.env.DATABASE_URL) {
    const cart = await prisma.cart.findFirst({ where: { ...(customerId ? { customerId } : { sessionId }) } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  mockCarts[key] = [];
}
