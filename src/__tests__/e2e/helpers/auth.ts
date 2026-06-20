import { request } from "@playwright/test";

const BASE = "http://localhost:3000";

export async function loginAsMerchant() {
  const ctx = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { "x-user-role": "merchant" },
  });
  await ctx.post("/api/auth/login", {
    data: { email: "merchant@demo.com", password: "merchant123" },
  });
  return ctx;
}

export async function loginAsAdmin() {
  const ctx = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { "x-user-role": "admin" },
  });
  await ctx.post("/api/auth/login", {
    data: { email: "admin@cloudcommerce.com", password: "admin123" },
  });
  return ctx;
}

export async function unauthContext() {
  return request.newContext({ baseURL: BASE });
}
