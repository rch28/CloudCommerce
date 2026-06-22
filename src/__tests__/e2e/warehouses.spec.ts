import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Warehouses API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/warehouses - returns list", async () => {
    const res = await ctx.get("/api/v1/warehouses");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/warehouses - creates warehouse", async () => {
    const res = await ctx.post("/api/v1/warehouses", {
      data: { name: `Main Warehouse ${ts}`, code: `MAIN-${ts}` },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toContain("Main Warehouse");
  });

  test("POST /api/v1/warehouses - validates required fields", async () => {
    const res = await ctx.post("/api/v1/warehouses", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/warehouses - supports pagination", async () => {
    const res = await ctx.get("/api/v1/warehouses?page=1&pageSize=10");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/warehouses/reserve - validates request body", async () => {
    const res = await ctx.post("/api/v1/warehouses/reserve", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/warehouses/release - validates request body", async () => {
    const res = await ctx.post("/api/v1/warehouses/release", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/warehouses/allocate - validates request body", async () => {
    const res = await ctx.post("/api/v1/warehouses/allocate", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/warehouses/transfers - returns stock transfers", async () => {
    const res = await ctx.get("/api/v1/warehouses/transfers");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/warehouses/transfers - validates request", async () => {
    const res = await ctx.post("/api/v1/warehouses/transfers", { data: {} });
    expect(res.status()).toBe(400);
  });
});
