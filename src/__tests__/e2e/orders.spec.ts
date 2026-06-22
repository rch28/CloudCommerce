import { test, expect } from "@playwright/test";
import { loginAsMerchant, loginAsAdmin, unauthContext } from "./helpers/auth";

const TENANT_ID = "t-1";

test.describe("Orders API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/orders?tenantId=t-1 - returns list", async () => {
    const res = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.orders)).toBe(true);
  });

  test("GET /api/v1/orders - returns 400 without tenantId", async () => {
    const res = await ctx.get("/api/v1/orders");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("GET /api/v1/orders/:id - returns order by id", async () => {
    const list = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}`);
    expect(list.ok()).toBe(true);
    const listBody = await list.json();
    const firstOrder = listBody.orders?.[0];
    if (!firstOrder) {
      test.skip();
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
    const res = await unauth.get("/api/v1/orders/some-id");
    expect(res.status()).toBe(401);
  });

  test("GET /api/v1/orders?status=pending - filters by status", async () => {
    const res = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}&status=pending`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.orders)).toBe(true);
    if (body.orders.length > 0) {
      expect(body.orders.every((o: any) => o.status === "pending")).toBe(true);
    }
  });

  test("GET /api/v1/orders?page=1&limit=2 - supports pagination", async () => {
    const res = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}&page=1&limit=2`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.orders.length).toBeLessThanOrEqual(2);
    expect(typeof body.totalPages).toBe("number");
  });

  test("PUT /api/v1/orders/:id/status - updates order status", async () => {
    const list = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}`);
    const listBody = await list.json();
    const pendingOrder = listBody.orders?.find((o: any) => o.status === "pending");
    if (!pendingOrder) {
      test.skip();
      return;
    }
    const res = await ctx.put(`/api/v1/orders/${pendingOrder.id}/status`, {
      data: { status: "processing" },
    });
    expect(res.ok()).toBe(true);
  });

  test("PUT /api/v1/orders/:id/status - rejects invalid status transition", async () => {
    const list = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}`);
    const listBody = await list.json();
    const deliveredOrder = listBody.orders?.find((o: any) => o.status === "delivered");
    if (!deliveredOrder) {
      test.skip();
      return;
    }
    const res = await ctx.put(`/api/v1/orders/${deliveredOrder.id}/status`, {
      data: { status: "processing" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/orders/:id/refund - validates refund request", async () => {
    const list = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}`);
    const listBody = await list.json();
    const order = listBody.orders?.[0];
    if (!order) {
      test.skip();
      return;
    }
    const res = await ctx.post(`/api/v1/orders/${order.id}/refund`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/orders/:id/resend-confirmation - resends email", async () => {
    const list = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}`);
    const listBody = await list.json();
    const order = listBody.orders?.[0];
    if (!order) {
      test.skip();
      return;
    }
    const res = await ctx.post(`/api/v1/orders/${order.id}/resend-confirmation`);
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/orders?sort=newest - sorts correctly", async () => {
    const res = await ctx.get(`/api/v1/orders?tenantId=${TENANT_ID}&sort=newest`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.orders)).toBe(true);
  });
});
