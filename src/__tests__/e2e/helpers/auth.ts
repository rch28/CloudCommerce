import { request } from "@playwright/test";

const BASE = "http://localhost:3000";

async function loginWithRetry(email: string, password: string, role: string) {
  const ctx = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { "x-user-role": role },
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await ctx.post("/api/auth/login", { data: { email, password } });
      if (res.ok()) return ctx;
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
      else throw new Error(`Login failed for ${email} after 3 attempts`);
    }
  }
  return ctx;
}

export async function loginAsMerchant() {
  return loginWithRetry("merchant@demo.com", "merchant123", "merchant");
}

export async function loginAsAdmin() {
  return loginWithRetry("admin@cloudcommerce.com", "admin123", "admin");
}

export async function unauthContext() {
  return request.newContext({ baseURL: BASE });
}
