import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shippingZone: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    shippingMethod: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    shippingRate: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockZone = (overrides = {}) => ({
  id: "zone-1",
  tenantId: "t-1",
  name: "Domestic",
  countries: ["US"],
  states: ["CA", "OR", "WA"],
  regions: [],
  zipCodes: [],
  zipRanges: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  rates: [],
  ...overrides,
});

const mockMethod = (overrides = {}) => ({
  id: "method-1",
  tenantId: "t-1",
  name: "Standard",
  type: "flat",
  configuration: { rate: 5.99 },
  carrier: null,
  carrierConfig: null,
  isActive: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  rates: [],
  ...overrides,
});

const mockRate = (overrides = {}) => ({
  id: "rate-1",
  zoneId: "zone-1",
  methodId: "method-1",
  price: 5.99,
  createdAt: new Date(),
  ...overrides,
});

describe("Shipping Providers", () => {
  it("FlatRateProvider returns configured rate", async () => {
    const { FlatRateProvider } = await import("@/lib/shipping/flat-rate");
    const provider = new FlatRateProvider();
    const options = await provider.calculate(
      { address: { country: "US", state: "CA" }, items: [{ variantId: "v1", quantity: 1, price: 50 }], subtotal: 50 },
      { rate: 10 },
    );
    expect(options).toHaveLength(1);
    expect(options[0].price).toBe(10);
    expect(options[0].type).toBe("flat");
  });

  it("FreeShippingProvider returns zero rate", async () => {
    const { FreeShippingProvider } = await import("@/lib/shipping/free-shipping");
    const provider = new FreeShippingProvider();
    const options = await provider.calculate(
      { address: { country: "US", state: "CA" }, items: [], subtotal: 0 },
      {},
    );
    expect(options).toHaveLength(1);
    expect(options[0].price).toBe(0);
  });

  it("WeightBasedProvider calculates by total weight", async () => {
    const { WeightBasedProvider } = await import("@/lib/shipping/weight-based");
    const provider = new WeightBasedProvider();
    const options = await provider.calculate(
      {
        address: { country: "US", state: "CA" },
        items: [
          { variantId: "v1", quantity: 2, weight: 1.5, price: 25 },
          { variantId: "v2", quantity: 1, weight: 3, price: 50 },
        ],
        subtotal: 100,
      },
      { rate: 2 },
    );
    expect(options).toHaveLength(1);
    expect(options[0].price).toBe(12); // (2*1.5 + 1*3) * 2 = 12
  });

  it("PriceBasedProvider respects min/max order", async () => {
    const { PriceBasedProvider } = await import("@/lib/shipping/price-based");
    const provider = new PriceBasedProvider();

    const belowMin = await provider.calculate(
      { address: { country: "US", state: "CA" }, items: [{ variantId: "v1", quantity: 1, price: 20 }], subtotal: 20 },
      { rate: 5, minOrder: 50 },
    );
    expect(belowMin).toHaveLength(0);

    const withinRange = await provider.calculate(
      { address: { country: "US", state: "CA" }, items: [{ variantId: "v1", quantity: 1, price: 75 }], subtotal: 75 },
      { rate: 5, minOrder: 50, maxOrder: 100 },
    );
    expect(withinRange).toHaveLength(1);
    expect(withinRange[0].price).toBe(5);

    const aboveMax = await provider.calculate(
      { address: { country: "US", state: "CA" }, items: [{ variantId: "v1", quantity: 1, price: 150 }], subtotal: 150 },
      { rate: 5, minOrder: 50, maxOrder: 100 },
    );
    expect(aboveMax).toHaveLength(0);
  });
});

describe("Shipping Service - Zones", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("lists zones for tenant", async () => {
    const { listZones } = await import("@/lib/services/shipping");
    vi.mocked(prisma.shippingZone.findMany).mockResolvedValue([mockZone()]);

    const zones = await listZones("t-1");
    expect(zones).toHaveLength(1);
    expect(prisma.shippingZone.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "t-1" } }),
    );
  });

  it("creates a zone", async () => {
    const { createZone } = await import("@/lib/services/shipping");
    vi.mocked(prisma.shippingZone.create).mockResolvedValue(mockZone());

    const zone = await createZone("t-1", {
      name: "Domestic",
      countries: ["US"],
      states: ["CA"],
      regions: [],
      zipCodes: [],
    });
    expect(zone.name).toBe("Domestic");
    expect(prisma.shippingZone.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "t-1", name: "Domestic" }),
      }),
    );
  });

  it("deletes a zone", async () => {
    const { deleteZone } = await import("@/lib/services/shipping");
    vi.mocked(prisma.shippingZone.findFirst).mockResolvedValue(mockZone());
    vi.mocked(prisma.shippingZone.delete).mockResolvedValue(mockZone());

    await deleteZone("zone-1", "t-1");
    expect(prisma.shippingZone.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "zone-1" } }),
    );
  });

  it("throws when deleting non-existent zone", async () => {
    const { deleteZone } = await import("@/lib/services/shipping");
    vi.mocked(prisma.shippingZone.findFirst).mockResolvedValue(null);

    await expect(deleteZone("zone-nonexistent", "t-1")).rejects.toThrow("Shipping zone not found");
  });
});

describe("Shipping Service - Methods", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("lists methods for tenant", async () => {
    const { listMethods } = await import("@/lib/services/shipping");
    vi.mocked(prisma.shippingMethod.findMany).mockResolvedValue([mockMethod()]);

    const methods = await listMethods("t-1");
    expect(methods).toHaveLength(1);
  });

  it("creates a method", async () => {
    const { createMethod } = await import("@/lib/services/shipping");
    vi.mocked(prisma.shippingMethod.create).mockResolvedValue(mockMethod());

    const method = await createMethod("t-1", {
      name: "Express",
      type: "flat",
      configuration: { rate: 15 },
    });
    expect(method.name).toBe("Standard");
    expect(prisma.shippingMethod.create).toHaveBeenCalled();
  });
});

describe("Shipping Service - Rates", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("sets a rate (upsert)", async () => {
    const { setRate } = await import("@/lib/services/shipping");
    vi.mocked(prisma.shippingRate.upsert).mockResolvedValue(mockRate());

    const rate = await setRate("zone-1", "method-1", 9.99);
    expect(Number(rate.price)).toBe(5.99);
    expect(prisma.shippingRate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { zoneId_methodId: { zoneId: "zone-1", methodId: "method-1" } },
        create: { zoneId: "zone-1", methodId: "method-1", price: 9.99 },
        update: { price: 9.99 },
      }),
    );
  });

  it("deletes a rate", async () => {
    const { deleteRate } = await import("@/lib/services/shipping");
    vi.mocked(prisma.shippingRate.deleteMany).mockResolvedValue({ count: 1 });

    await deleteRate("zone-1", "method-1");
    expect(prisma.shippingRate.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { zoneId: "zone-1", methodId: "method-1" } }),
    );
  });
});

describe("Shipping Service - Address Matching", () => {
  it("matches by country", async () => {
    const { calculateShipping } = await import("@/lib/services/shipping");

    vi.mocked(prisma.shippingZone.findMany).mockResolvedValue([
      mockZone({
        countries: ["US", "CA"],
        states: [],
        zipCodes: [],
        rates: [mockRate({ method: mockMethod({ isActive: true }) })],
      }),
    ]);

    const options = await calculateShipping("t-1", { country: "US", state: "CA" }, []);
    expect(options).toHaveLength(1);
  });

  it("does not match excluded country", async () => {
    const { calculateShipping } = await import("@/lib/services/shipping");

    vi.mocked(prisma.shippingZone.findMany).mockResolvedValue([
      mockZone({
        countries: ["US"],
        states: [],
        rates: [mockRate({ method: mockMethod({ isActive: true }) })],
      }),
    ]);

    const options = await calculateShipping("t-1", { country: "MX", state: "" }, []);
    expect(options).toHaveLength(0);
  });

  it("matches by state", async () => {
    const { calculateShipping } = await import("@/lib/services/shipping");

    vi.mocked(prisma.shippingZone.findMany).mockResolvedValue([
      mockZone({
        countries: ["US"],
        states: ["CA", "OR"],
        rates: [mockRate({ method: mockMethod({ isActive: true }) })],
      }),
    ]);

    const options = await calculateShipping("t-1", { country: "US", state: "OR" }, []);
    expect(options).toHaveLength(1);
  });

  it("filters inactive methods", async () => {
    const { calculateShipping } = await import("@/lib/services/shipping");

    vi.mocked(prisma.shippingZone.findMany).mockResolvedValue([
      mockZone({
        countries: ["US"],
        rates: [mockRate({ method: mockMethod({ isActive: false }) })],
      }),
    ]);

    const options = await calculateShipping("t-1", { country: "US", state: "CA" }, []);
    expect(options).toHaveLength(0);
  });

  it("returns cheapest option first", async () => {
    const { calculateShipping } = await import("@/lib/services/shipping");

    vi.mocked(prisma.shippingZone.findMany).mockResolvedValue([
      mockZone({
        countries: ["US"],
        rates: [
          mockRate({ id: "r1", methodId: "m1", price: 15, method: mockMethod({ id: "m1", name: "Express", isActive: true }) }),
          mockRate({ id: "r2", methodId: "m2", price: 5, method: mockMethod({ id: "m2", name: "Economy", isActive: true }) }),
        ],
      }),
    ]);

    const options = await calculateShipping("t-1", { country: "US", state: "CA" }, []);
    expect(options).toHaveLength(2);
    expect(options[0].price).toBeLessThanOrEqual(options[1].price);
  });
});

describe("Pricing Service", () => {
  it("accepts custom shipping cost", async () => {
    const { calculatePricing } = await import("@/lib/services/pricing");
    const result = calculatePricing([{ price: 50, quantity: 1 }], 7.99);
    expect(result.subtotal).toBe(50);
    expect(result.shipping).toBe(7.99);
    expect(result.tax).toBe(4);
    expect(result.total).toBe(61.99);
  });

  it("defaults to zero shipping", async () => {
    const { calculatePricing } = await import("@/lib/services/pricing");
    const result = calculatePricing([{ price: 50, quantity: 1 }]);
    expect(result.shipping).toBe(0);
  });
});
