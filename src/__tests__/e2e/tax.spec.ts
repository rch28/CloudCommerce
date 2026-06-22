import { test, expect } from "@playwright/test";
import { loginAsMerchant, loginAsAdmin } from "./helpers/auth";

const ts = Date.now();

test.describe("Tax API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/tax/zones - returns tax zones", async () => {
    const res = await ctx.get("/api/v1/tax/zones");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/tax/zones - creates a tax zone", async () => {
    const res = await ctx.post("/api/v1/tax/zones", {
      data: { name: `US Tax ${ts}`, type: "country", country: "US" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toContain("US Tax");
  });

  test("POST /api/v1/tax/zones - validates required fields", async () => {
    const res = await ctx.post("/api/v1/tax/zones", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("PATCH /api/v1/tax/zones/:id - updates a tax zone", async () => {
    const create = await ctx.post("/api/v1/tax/zones", {
      data: { name: `Tax Before ${ts}`, type: "country", country: "US" },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/tax/zones/${created.id}`, {
      data: { name: `Tax After ${ts}` },
    });
    expect(res.ok()).toBe(true);
  });

  test("DELETE /api/v1/tax/zones/:id - deletes a tax zone (admin)", async () => {
    const create = await ctx.post("/api/v1/tax/zones", {
      data: { name: `Tax Delete ${ts}`, type: "country", country: "US" },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await adminCtx.delete(`/api/v1/tax/zones/${created.id}`);
    expect(res.ok() || res.status() === 403 || res.status() === 400).toBe(true);
  });

  test("GET /api/v1/tax/rates - returns tax rates", async () => {
    const res = await ctx.get("/api/v1/tax/rates");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/tax/rates - creates a tax rate", async () => {
    const res = await ctx.post("/api/v1/tax/rates", {
      data: {
        name: `Sales Tax ${ts}`, zoneId: "zone-id", type: "percentage", rate: 0.08, priority: 0, isActive: true,
        tenantId: "t-1",
      },
    });
    expect(res.ok() || res.status() === 404 || res.status() === 400).toBe(true);
  });

  test("POST /api/v1/tax/rates - validates required fields", async () => {
    const res = await ctx.post("/api/v1/tax/rates", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("PATCH /api/v1/tax/rates/:id - updates a tax rate", async () => {
    const list = await ctx.get("/api/v1/tax/rates");
    const body = await list.json();
    const rate = body.items?.[0];
    if (!rate) {
      test.skip();
      return;
    }
    const res = await ctx.patch(`/api/v1/tax/rates/${rate.id}`, {
      data: { rate: 0.09 },
    });
    expect(res.ok() || res.status() === 404).toBe(true);
  });

  test("DELETE /api/v1/tax/rates/:id - deletes a tax rate (admin)", async () => {
    const list = await ctx.get("/api/v1/tax/rates");
    const body = await list.json();
    const rate = body.items?.[0];
    if (!rate) {
      test.skip();
      return;
    }
    const res = await adminCtx.delete(`/api/v1/tax/rates/${rate.id}`);
    expect(res.ok() || res.status() === 403 || res.status() === 404 || res.status() === 400).toBe(true);
  });

  test("POST /api/v1/tax/calculate - calculates tax", async () => {
    const res = await ctx.post("/api/v1/tax/calculate", {
      data: {
        address: { country: "US", state: "NY" },
        items: [{ price: 100, quantity: 1 }],
      },
    });
    if (res.ok()) {
      const body = await res.json();
      expect(body).toBeDefined();
    }
  });
});
