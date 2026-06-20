import { test, expect } from "@playwright/test";
import { loginAsMerchant, loginAsAdmin, unauthContext } from "./helpers/auth";

const ts = Date.now();

test.describe("Coupons API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/coupons - returns list", async () => {
    const res = await ctx.get("/api/v1/coupons");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/coupons - creates a coupon", async () => {
    const code = `TEST10-${ts}`;
    const res = await ctx.post("/api/v1/coupons", {
      data: { code, type: "fixed", value: 10, startsAt: new Date().toISOString() },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.code).toBe(code);
  });

  test("POST /api/v1/coupons - rejects duplicate code", async () => {
    const code = `UNIQUE-${ts}`;
    await ctx.post("/api/v1/coupons", {
      data: { code, type: "fixed", value: 5, startsAt: new Date().toISOString() },
    });
    const res = await ctx.post("/api/v1/coupons", {
      data: { code, type: "fixed", value: 5, startsAt: new Date().toISOString() },
    });
    expect(res.status()).toBe(409);
  });

  test("POST /api/v1/coupons - validates required fields", async () => {
    const res = await ctx.post("/api/v1/coupons", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/coupons/:id - returns coupon", async () => {
    const code = `GETME-${ts}`;
    const create = await ctx.post("/api/v1/coupons", {
      data: { code, type: "percentage", value: 15, startsAt: new Date().toISOString() },
    });
    const created = await create.json();
    const res = await ctx.get(`/api/v1/coupons/${created.id}`);
    expect(res.ok()).toBe(true);
  });

  test("PATCH /api/v1/coupons/:id - updates coupon", async () => {
    const code = `PATCHME-${ts}`;
    const create = await ctx.post("/api/v1/coupons", {
      data: { code, type: "fixed", value: 5, startsAt: new Date().toISOString() },
    });
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/coupons/${created.id}`, { data: { value: 20 } });
    expect(res.ok()).toBe(true);
  });

  test("DELETE /api/v1/coupons/:id - deletes coupon (admin)", async () => {
    const code = `DELETEME-${ts}`;
    const create = await ctx.post("/api/v1/coupons", {
      data: { code, type: "fixed", value: 1, startsAt: new Date().toISOString() },
    });
    const created = await create.json();
    // Use admin context for delete (merchant may lack delete permission)
    const res = await adminCtx.delete(`/api/v1/coupons/${created.id}`);
    expect(res.ok()).toBe(true);
  });
});
