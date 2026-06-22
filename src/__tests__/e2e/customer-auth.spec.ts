import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const ts = Date.now();

test.describe("Customer Auth API (Storefront)", () => {
  test("POST /api/v1/auth/customer/register - registers a new customer", async () => {
    const email = `cust-reg-${ts}@test.com`;
    const res = await fetch(`${BASE}/api/v1/auth/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", name: "Test Customer", tenantId: "t-1" }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.user.email).toBe(email);
  });

  test("POST /api/v1/auth/customer/register - rejects duplicate email", async () => {
    const email = `cust-dupe-${ts}@test.com`;
    const first = await fetch(`${BASE}/api/v1/auth/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", name: "First", tenantId: "t-1" }),
    });
    expect(first.ok).toBe(true);

    const second = await fetch(`${BASE}/api/v1/auth/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "other123", name: "Second", tenantId: "t-1" }),
    });
    expect(second.status).toBe(409);
  });

  test("POST /api/v1/auth/customer/register - validates required fields", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test("POST /api/v1/auth/customer/register - validates tenantId", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `no-tenant-${ts}@test.com`, password: "password123" }),
    });
    expect(res.status).toBe(400);
  });

  test("POST /api/v1/auth/customer/login - logs in with correct credentials", async () => {
    const email = `cust-login-${ts}@test.com`;
    await fetch(`${BASE}/api/v1/auth/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", name: "Login Test", tenantId: "t-1" }),
    });

    const res = await fetch(`${BASE}/api/v1/auth/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", tenantId: "t-1" }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.user.email).toBe(email);
  });

  test("POST /api/v1/auth/customer/login - rejects wrong password", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "liam@mail.com", password: "wrong", tenantId: "t-1" }),
    });
    expect(res.status).toBe(401);
  });

  test("POST /api/v1/auth/customer/login - rejects non-existent email", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `nobody-${ts}@test.com`, password: "password123", tenantId: "t-1" }),
    });
    expect(res.status).toBe(401);
  });
});
