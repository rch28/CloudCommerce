import { test, expect } from "@playwright/test";
import { loginAsMerchant, unauthContext } from "./helpers/auth";

const TENANT_ID = "t-1";

test.describe("Orders API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/orders?tenantId=t-1 - returns list", async () => {
    const res = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // listMerchantOrders returns { orders, total, page, limit, totalPages }
    expect(Array.isArray(body.orders)).toBe(true);
  });

  test("GET /api/v1/orders - returns 400 without tenantId", async () => {
    const res = await ctx.get("/api/v1/orders");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("GET /api/v1/orders/:id - returns order by id", async () => {
    // First get a known order from the list
    const list = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}`);
    expect(list.ok()).toBe(true);
    const listBody = await list.json();
    const firstOrder = listBody.orders?.[0];
    if (!firstOrder) {
      test.skip(); // no orders to test with
      return;
    }
    const res = await ctx.get(`/api/v1/orders/${firstOrder.id}`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.order).toBeDefined();
    expect(body.order.id).toBe(firstOrder.id);
  });

  test("GET /api/v1/orders/:id - returns 401 without auth", async () => {
    const unauth = await unauthContext();
    // The [id] route checks session auth and returns 401
    const res = await unauth.get("/api/v1/orders/some-id");
    expect(res.status()).toBe(401);
  });
});
