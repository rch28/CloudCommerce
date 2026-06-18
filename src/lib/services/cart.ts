import { prisma } from "@/lib/prisma";
import { calculatePricing, type PricingResult } from "@/lib/services/pricing";

export interface CartItemData {
  variantId: string;
  quantity: number;
  price: number;
}

export interface CartItemResponse {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  image: string | null;
  price: number;
  sku: string;
  quantity: number;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  pricing: PricingResult;
  itemCount: number;
}

function mapCartItem(item: any): CartItemResponse {
  const product = item.variant?.product;
  const firstImage = product?.images?.[0]?.url ?? null;
  return {
    id: item.id,
    variantId: item.variantId,
    productId: product?.id ?? "",
    productName: product?.name ?? "",
    slug: product?.slug ?? "",
    image: firstImage,
    price: Number(item.price),
    sku: item.variant?.sku ?? "",
    quantity: item.quantity,
  };
}

export async function getCartByCustomer(customerId: string, tenantId: string): Promise<CartResponse | null> {
  const cart = await prisma.cart.findFirst({
    where: { customerId, tenantId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 } },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return null;

  const items = cart.items.map(mapCartItem);
  const pricing = calculatePricing(items.map((i) => ({ price: i.price, quantity: i.quantity })));
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { id: cart.id, items, pricing, itemCount };
}

export async function getCartBySession(sessionId: string, tenantId: string): Promise<CartResponse | null> {
  const cart = await prisma.cart.findFirst({
    where: { sessionId, tenantId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 } },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return null;

  const items = cart.items.map(mapCartItem);
  const pricing = calculatePricing(items.map((i) => ({ price: i.price, quantity: i.quantity })));
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { id: cart.id, items, pricing, itemCount };
}

export async function validateInventory(variantId: string, requestedQty: number): Promise<{ valid: boolean; available: number; error?: string }> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { quantity: true, status: true },
  });

  if (!variant) return { valid: false, available: 0, error: "Variant not found" };
  if (variant.status !== "active") return { valid: false, available: 0, error: "Variant is not available" };
  if (variant.quantity < requestedQty) {
    return { valid: false, available: variant.quantity, error: `Only ${variant.quantity} available` };
  }

  return { valid: true, available: variant.quantity };
}

export async function addToCart(
  customerId: string | null,
  sessionId: string | null,
  tenantId: string,
  variantId: string,
  quantity: number,
  price: number,
): Promise<CartItemResponse> {
  const iv = await validateInventory(variantId, quantity);
  if (!iv.valid) throw new Error(iv.error);

  let cart = customerId
    ? await prisma.cart.findFirst({ where: { customerId, tenantId } })
    : await prisma.cart.findFirst({ where: { sessionId, tenantId } });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId, sessionId, tenantId },
    });
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, variantId },
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 } } },
        },
      },
    },
  });

  if (existing) {
    const newQty = existing.quantity + quantity;
    const iv2 = await validateInventory(variantId, newQty);
    if (!iv2.valid) throw new Error(iv2.error);

    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 } } },
          },
        },
      },
    });
    return mapCartItem(updated);
  }

  const created = await prisma.cartItem.create({
    data: { cartId: cart.id, variantId, quantity, price },
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 } } },
        },
      },
    },
  });
  return mapCartItem(created);
}

export async function updateCartItemQuantity(
  customerId: string | null,
  sessionId: string | null,
  variantId: string,
  quantity: number,
): Promise<CartItemResponse> {
  if (quantity < 1) throw new Error("Quantity must be at least 1");

  const iv = await validateInventory(variantId, quantity);
  if (!iv.valid) throw new Error(iv.error);

  const cart = customerId
    ? await prisma.cart.findFirst({ where: { customerId } })
    : await prisma.cart.findFirst({ where: { sessionId } });
  if (!cart) throw new Error("Cart not found");

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, variantId },
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 } } },
        },
      },
    },
  });
  if (!existing) throw new Error("Item not found in cart");

  const updated = await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity },
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 } } },
        },
      },
    },
  });
  return mapCartItem(updated);
}

export async function removeFromCart(
  customerId: string | null,
  sessionId: string | null,
  variantId: string,
): Promise<void> {
  const cart = customerId
    ? await prisma.cart.findFirst({ where: { customerId } })
    : await prisma.cart.findFirst({ where: { sessionId } });
  if (!cart) throw new Error("Cart not found");

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, variantId },
  });
}

export async function clearUserCart(customerId: string | null, sessionId: string | null): Promise<void> {
  const cart = customerId
    ? await prisma.cart.findFirst({ where: { customerId } })
    : await prisma.cart.findFirst({ where: { sessionId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}

export async function mergeGuestCart(sessionId: string, customerId: string, tenantId: string): Promise<CartResponse> {
  const guestCart = await prisma.cart.findFirst({
    where: { sessionId, tenantId },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) {
    const existing = await getCartByCustomer(customerId, tenantId);
    if (existing) return existing;
    return { id: "", items: [], pricing: calculatePricing([]), itemCount: 0 };
  }

  let userCart = await prisma.cart.findFirst({ where: { customerId, tenantId } });
  if (!userCart) {
    userCart = await prisma.cart.create({
      data: { customerId, tenantId },
    });
  }

  for (const guestItem of guestCart.items) {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: userCart.id, variantId: guestItem.variantId },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + guestItem.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
          price: guestItem.price,
        },
      });
    }
  }

  await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
  await prisma.cart.delete({ where: { id: guestCart.id } });

  const result = await getCartByCustomer(customerId, tenantId);
  return result ?? { id: "", items: [], pricing: calculatePricing([]), itemCount: 0 };
}
