import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishlist: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    wishlistItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    cart: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
  },
}));

const FIXED_DATE = new Date("2026-01-01T00:00:00Z");

const mockWishlist = (overrides = {}) => ({
  id: "wl-1",
  customerId: null,
  sessionId: "sess-1",
  shareToken: null,
  tenantId: "t-1",
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  items: [],
  ...overrides,
});

const mockItem = (overrides = {}) => ({
  id: "wi-1",
  wishlistId: "wl-1",
  variantId: "var-1",
  addedAt: FIXED_DATE,
  variant: {
    id: "var-1",
    sku: "SKU-001",
    price: 29.99,
    comparePrice: null,
    quantity: 10,
    product: {
      id: "prod-1",
      name: "Test Product",
      slug: "test-product",
      images: [{ url: "/test.jpg" }],
      status: "active",
    },
  },
  ...overrides,
});

describe("Wishlist Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateWishlist", () => {
    it("creates a wishlist if none exists", async () => {
      const { addItem } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.wishlist.create).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.wishlistItem.create).mockResolvedValue(mockItem());

      const result = await addItem("t-1", "var-1", { sessionId: "sess-1" });

      expect(prisma.wishlist.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sessionId: "sess-1", tenantId: "t-1" } }),
      );
      expect(prisma.wishlist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sessionId: "sess-1", tenantId: "t-1" }),
        }),
      );
      expect(result).toBeDefined();
    });

    it("returns existing wishlist if found", async () => {
      const { addItem } = await import("@/lib/services/wishlist");

      const existing = mockWishlist({ items: [mockItem()] });
      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(existing);
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue(mockItem());

      const result = await addItem("t-1", "var-1", { sessionId: "sess-1" });

      expect(prisma.wishlist.create).not.toHaveBeenCalled();
      expect(result).toMatchObject(mockItem());
    });

    it("finds wishlist by customerId for authenticated users", async () => {
      const { getWishlist } = await import("@/lib/services/wishlist");

      const existing = mockWishlist({ customerId: "cust-1", sessionId: null });
      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(existing);

      await getWishlist("t-1", { customerId: "cust-1" });

      expect(prisma.wishlist.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { customerId: "cust-1", tenantId: "t-1" } }),
      );
    });
  });

  describe("addItem", () => {
    it("does not create duplicate items", async () => {
      const { addItem } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue(mockItem());

      const result = await addItem("t-1", "var-1", { sessionId: "sess-1" });

      expect(prisma.wishlistItem.create).not.toHaveBeenCalled();
      expect(result).toMatchObject(mockItem());
    });

    it("creates new item if not duplicate", async () => {
      const { addItem } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.wishlistItem.create).mockResolvedValue(mockItem());

      const result = await addItem("t-1", "var-1", { sessionId: "sess-1" });

      expect(prisma.wishlistItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { wishlistId: "wl-1", variantId: "var-1" },
        }),
      );
      expect(result).toMatchObject(mockItem());
    });
  });

  describe("removeItem", () => {
    it("deletes the item from the wishlist", async () => {
      const { removeItem } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlistItem.deleteMany).mockResolvedValue({ count: 1 });

      await removeItem("t-1", "var-1", { sessionId: "sess-1" });

      expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { wishlistId: "wl-1", variantId: "var-1" },
        }),
      );
    });
  });

  describe("getWishlistCount", () => {
    it("returns 0 when no wishlist exists", async () => {
      const { getWishlistCount } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(null);

      const count = await getWishlistCount("t-1", { sessionId: "sess-1" });

      expect(count).toBe(0);
    });

    it("returns item count", async () => {
      const { getWishlistCount } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlistItem.count).mockResolvedValue(3);

      const count = await getWishlistCount("t-1", { sessionId: "sess-1" });

      expect(count).toBe(3);
    });
  });

  describe("generateShareLink", () => {
    it("creates a share token if none exists", async () => {
      const { generateShareLink } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlist.update).mockResolvedValue({
        ...mockWishlist(),
        shareToken: "abc123",
      });

      const token = await generateShareLink("t-1", { sessionId: "sess-1" });

      expect(prisma.wishlist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "wl-1" },
          data: expect.objectContaining({ shareToken: expect.any(String) }),
        }),
      );
      expect(token).toBeTruthy();
    });

    it("returns existing share token", async () => {
      const { generateShareLink } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(
        mockWishlist({ shareToken: "existing-token" }),
      );

      const token = await generateShareLink("t-1", { sessionId: "sess-1" });

      expect(prisma.wishlist.update).not.toHaveBeenCalled();
      expect(token).toBe("existing-token");
    });
  });

  describe("getByShareToken", () => {
    it("returns wishlist items for valid token", async () => {
      const { getByShareToken } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findUnique).mockResolvedValue(
        mockWishlist({
          shareToken: "token-1",
          items: [mockItem()],
        }),
      );

      const result = await getByShareToken("token-1");

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].variant.product.name).toBe("Test Product");
    });

    it("returns null for invalid token", async () => {
      const { getByShareToken } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findUnique).mockResolvedValue(null);

      const result = await getByShareToken("invalid-token");

      expect(result).toBeNull();
    });
  });

  describe("syncAfterLogin", () => {
    it("merges guest wishlist into customer wishlist and deletes guest", async () => {
      const { syncAfterLogin } = await import("@/lib/services/wishlist");

      const guestWishlist = mockWishlist({
        id: "wl-guest",
        sessionId: "sess-guest",
        items: [
          mockItem({ id: "wi-guest-1", variantId: "var-1" }),
          mockItem({ id: "wi-guest-2", variantId: "var-2" }),
        ],
      });

      const customerWishlist = mockWishlist({
        id: "wl-cust",
        customerId: "cust-1",
        sessionId: null,
        items: [mockItem({ id: "wi-cust-1", variantId: "var-1" })],
      });

      vi.mocked(prisma.wishlist.findFirst)
        .mockResolvedValueOnce(guestWishlist)
        .mockResolvedValueOnce(customerWishlist);

      vi.mocked(prisma.wishlistItem.findUnique)
        .mockResolvedValueOnce(mockItem({ id: "wi-cust-1" }))
        .mockResolvedValueOnce(null);

      vi.mocked(prisma.wishlistItem.create).mockResolvedValue(
        mockItem({ id: "wi-guest-2", variantId: "var-2" }),
      );

      await syncAfterLogin("sess-guest", "cust-1", "t-1");

      expect(prisma.wishlistItem.create).toHaveBeenCalledTimes(1);
      expect(prisma.wishlistItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { wishlistId: "wl-cust", variantId: "var-2" },
        }),
      );

      expect(prisma.wishlist.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "wl-guest" } }),
      );
    });

    it("does nothing if guest wishlist is empty", async () => {
      const { syncAfterLogin } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist({ items: [] }));

      await syncAfterLogin("sess-guest", "cust-1", "t-1");

      expect(prisma.wishlistItem.create).not.toHaveBeenCalled();
      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
    });

    it("does nothing if no guest wishlist exists", async () => {
      const { syncAfterLogin } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(null);

      await syncAfterLogin("sess-guest", "cust-1", "t-1");

      expect(prisma.wishlistItem.create).not.toHaveBeenCalled();
      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
    });
  });

  describe("moveToCart", () => {
    it("moves item from wishlist to cart", async () => {
      const { moveToCart } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlistItem.findFirst).mockResolvedValue(
        mockItem({ wishlistId: "wl-1" }),
      );
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
        id: "var-1",
        price: 29.99,
        quantity: 10,
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue({
        id: "cart-1",
        customerId: null,
        sessionId: "sess-1",
        tenantId: "t-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cartItem.create).mockResolvedValue({} as any);
      vi.mocked(prisma.wishlistItem.delete).mockResolvedValue({} as any);

      await moveToCart("t-1", "wi-1", 1, { sessionId: "sess-1" });

      expect(prisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cartId: "cart-1",
            variantId: "var-1",
            quantity: 1,
            price: 29.99,
          }),
        }),
      );
      expect(prisma.wishlistItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "wi-1" } }),
      );
    });

    it("throws if wishlist item not found", async () => {
      const { moveToCart } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlistItem.findFirst).mockResolvedValue(null);

      await expect(
        moveToCart("t-1", "wi-invalid", 1, { sessionId: "sess-1" }),
      ).rejects.toThrow("Wishlist item not found");
    });

    it("throws if insufficient stock", async () => {
      const { moveToCart } = await import("@/lib/services/wishlist");

      vi.mocked(prisma.wishlist.findFirst).mockResolvedValue(mockWishlist());
      vi.mocked(prisma.wishlistItem.findFirst).mockResolvedValue(
        mockItem({ wishlistId: "wl-1" }),
      );
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
        id: "var-1",
        price: 29.99,
        quantity: 0,
      } as any);

      await expect(
        moveToCart("t-1", "wi-1", 1, { sessionId: "sess-1" }),
      ).rejects.toThrow("Insufficient stock");
    });
  });
});
