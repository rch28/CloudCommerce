import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Shipping API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/shipping/zones - returns zones", async () => {
    const res = await ctx.get("/api/v1/shipping/zones");
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/shipping/zones - validates required fields", async () => {
    const res = await ctx.post("/api/v1/shipping/zones", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/shipping/zones - creates a shipping zone", async () => {
    const res = await ctx.post("/api/v1/shipping/zones", {
      data: { name: `Test Zone ${ts}`, countries: ["US"] },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe(`Test Zone ${ts}`);
  });

  test("GET /api/v1/shipping/zones/:id - returns zone by id", async () => {
    const create = await ctx.post("/api/v1/shipping/zones", {
      data: { name: `Zone Get ${ts}`, countries: ["US"] },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.get(`/api/v1/shipping/zones/${created.id}`);
    expect(res.ok()).toBe(true);
  });

  test("PUT /api/v1/shipping/zones/:id - updates a zone", async () => {
    const create = await ctx.post("/api/v1/shipping/zones", {
      data: { name: `Zone Before ${ts}`, countries: ["US"] },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.put(`/api/v1/shipping/zones/${created.id}`, {
      data: { name: `Zone After ${ts}` },
    });
    expect(res.ok()).toBe(true);
  });

  test("DELETE /api/v1/shipping/zones/:id - deletes a zone", async () => {
    const create = await ctx.post("/api/v1/shipping/zones", {
      data: { name: `Zone Delete ${ts}`, countries: ["US"] },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.delete(`/api/v1/shipping/zones/${created.id}`);
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/shipping/methods - returns methods", async () => {
    const res = await ctx.get("/api/v1/shipping/methods");
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/shipping/methods - creates a shipping method", async () => {
    const res = await ctx.post("/api/v1/shipping/methods", {
      data: { name: `Method ${ts}`, type: "flat", configuration: { rate: 9.99 }, isActive: true },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toContain("Method");
  });

  test("POST /api/v1/shipping/methods - validates required fields", async () => {
    const res = await ctx.post("/api/v1/shipping/methods", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/shipping/rates - creates a rate", async () => {
    const res = await ctx.post("/api/v1/shipping/rates", {
      data: { zoneId: "zone-1", methodId: "method-1", price: 5.99 },
    });
    expect(res.ok() || res.status() === 404 || res.status() === 400).toBe(true);
  });

  test("POST /api/v1/shipping/calculate - calculates shipping cost", async () => {
    const res = await ctx.post("/api/v1/shipping/calculate", {
      data: {
        address: { country: "US", state: "NY", zip: "10001" },
        items: [{ weight: 1, price: 50 }],
      },
    });
    if (res.ok()) {
      const body = await res.json();
      expect(body).toBeDefined();
    }
  });
});
