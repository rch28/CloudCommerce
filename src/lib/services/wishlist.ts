import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateShareToken(): string {
  return randomBytes(24).toString("hex");
}

async function getOrCreateWishlist(
  tenantId: string,
  opts: { customerId?: string; sessionId?: string },
) {
  let wishlist = await prisma.wishlist.findFirst({
    where: opts.customerId ? { customerId: opts.customerId, tenantId } : { sessionId: opts.sessionId, tenantId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 }, status: true } },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: {
        customerId: opts.customerId ?? null,
        sessionId: opts.sessionId ?? null,
        tenantId,
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 }, status: true } },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    });
  }

  return wishlist;
}

export type WishlistWithItems = Awaited<ReturnType<typeof getOrCreateWishlist>>;

export async function addItem(
  tenantId: string,
  variantId: string,
  opts: { customerId?: string; sessionId?: string },
) {
  const wishlist = await getOrCreateWishlist(tenantId, opts);

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_variantId: { wishlistId: wishlist.id, variantId } },
  });

  if (existing) return existing;

  return prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, variantId },
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 }, status: true } },
        },
      },
    },
  });
}

export async function removeItem(
  tenantId: string,
  variantId: string,
  opts: { customerId?: string; sessionId?: string },
) {
  const wishlist = await getOrCreateWishlist(tenantId, opts);

  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, variantId },
  });
}

export async function moveToCart(
  tenantId: string,
  wishlistItemId: string,
  quantity: number,
  opts: { customerId?: string; sessionId?: string },
) {
  const wishlist = await getOrCreateWishlist(tenantId, opts);

  const item = await prisma.wishlistItem.findFirst({
    where: { id: wishlistItemId, wishlistId: wishlist.id },
  });

  if (!item) throw new Error("Wishlist item not found");

  const variant = await prisma.productVariant.findUnique({
    where: { id: item.variantId },
    select: { id: true, price: true, quantity: true },
  });

  if (!variant) throw new Error("Variant not found");
  if (variant.quantity < quantity) throw new Error("Insufficient stock");

  const cartWhere = opts.customerId
    ? { customerId: opts.customerId, tenantId }
    : { sessionId: opts.sessionId, tenantId };

  let cart = await prisma.cart.findFirst({ where: cartWhere });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        customerId: opts.customerId ?? null,
        sessionId: opts.sessionId ?? null,
        tenantId,
      },
    });
  }

  const existingCartItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, variantId: item.variantId },
  });

  if (existingCartItem) {
    await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: existingCartItem.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: item.variantId,
        quantity,
        price: variant.price,
      },
    });
  }

  await prisma.wishlistItem.delete({ where: { id: item.id } });
}

export async function getWishlist(
  tenantId: string,
  opts: { customerId?: string; sessionId?: string },
) {
  return getOrCreateWishlist(tenantId, opts);
}

export async function getWishlistCount(
  tenantId: string,
  opts: { customerId?: string; sessionId?: string },
): Promise<number> {
  const wishlist = opts.customerId
    ? await prisma.wishlist.findFirst({ where: { customerId: opts.customerId, tenantId } })
    : await prisma.wishlist.findFirst({ where: { sessionId: opts.sessionId, tenantId } });

  if (!wishlist) return 0;
  return prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } });
}

export async function generateShareLink(
  tenantId: string,
  opts: { customerId?: string; sessionId?: string },
): Promise<string> {
  const wishlist = await getOrCreateWishlist(tenantId, opts);

  if (!wishlist.shareToken) {
    const token = generateShareToken();
    await prisma.wishlist.update({
      where: { id: wishlist.id },
      data: { shareToken: token },
    });
    return token;
  }

  return wishlist.shareToken;
}

export async function getByShareToken(shareToken: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { shareToken },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true, name: true, slug: true,
                  images: { select: { url: true }, take: 1 },
                  store: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!wishlist) return null;

  return {
    items: wishlist.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      addedAt: item.addedAt,
      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        price: Number(item.variant.price),
        comparePrice: item.variant.comparePrice ? Number(item.variant.comparePrice) : null,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          slug: item.variant.product.slug,
          image: item.variant.product.images[0]?.url ?? null,
          storeName: item.variant.product.store?.name ?? null,
        },
      },
    })),
  };
}

export async function syncAfterLogin(
  sessionId: string,
  customerId: string,
  tenantId: string,
): Promise<void> {
  const guestWishlist = await prisma.wishlist.findFirst({
    where: { sessionId, tenantId },
    include: { items: true },
  });

  if (!guestWishlist || guestWishlist.items.length === 0) return;

  const customerWishlist = await getOrCreateWishlist(tenantId, { customerId });

  for (const item of guestWishlist.items) {
    const exists = await prisma.wishlistItem.findUnique({
      where: { wishlistId_variantId: { wishlistId: customerWishlist.id, variantId: item.variantId } },
    });
    if (!exists) {
      await prisma.wishlistItem.create({
        data: { wishlistId: customerWishlist.id, variantId: item.variantId },
      });
    }
  }

  await prisma.wishlist.delete({ where: { id: guestWishlist.id } });
}
