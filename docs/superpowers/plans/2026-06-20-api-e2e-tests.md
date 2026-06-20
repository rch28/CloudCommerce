# API E2E Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) to implement this plan task-by-task.

**Goal:** Comprehensive Playwright E2E test suite covering all API resource endpoints with CRUD operations, error handling, auth checks, and edge cases.

**Architecture:** One spec file per API resource module, testing all HTTP methods (GET, POST, PUT/PATCH, DELETE) with success + error cases using in-memory mock data (no DB required). Tests run against the dev server via `bun run dev`.

**Tech Stack:** Playwright 1.61+, TypeScript, existing `playwright.config.ts` at project root. Auth uses cookie-based session obtained via `POST /api/auth/login`.

---
## Pre-requisite Tasks

### Task 0: Auth helper & test utilities

**Files:**

- Create: `src/__tests__/e2e/helpers/auth.ts`
- Create: `src/__tests__/e2e/helpers/index.ts`

- [ ] **Step 1: Create auth helper**

```ts
import { request } from "@playwright/test";

const BASE = "http://localhost:3000";

export async function loginAsMerchant() {
  const ctx = await request.newContext({ baseURL: BASE });
  await ctx.post("/api/auth/login", {
    data: { email: "merchant@test.com", password: "password123" },
  });
  return ctx;
}

export async function loginAsAdmin() {
  const ctx = await request.newContext({ baseURL: BASE });
  await ctx.post("/api/auth/login", {
    data: { email: "admin@test.com", password: "password123" },
  });
  return ctx;
}

export async function unauthContext() {
  return request.newContext({ baseURL: BASE });
}
```

- [ ] **Step 2: Create helpers index**

```ts
export { loginAsMerchant, loginAsAdmin, unauthContext } from "./auth";
```

- [ ] **Step 3: Run dry check**

Run: `bun run typecheck`
Expected: PASS

### Task 1: Categories API tests

**Files:**

- Create: `src/__tests__/e2e/categories.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant, unauthContext } from "./helpers/auth";

test.describe("Categories API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/categories - returns list", async () => {
    const res = await ctx.get("/api/v1/categories");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/categories - returns 401 without auth", async () => {
    const unauth = await unauthContext();
    const res = await unauth.get("/api/v1/categories");
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/categories - creates a category", async () => {
    const res = await ctx.post("/api/v1/categories", {
      data: { name: "Test Cat", slug: "test-cat" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Test Cat");
    expect(body.slug).toBe("test-cat");
  });

  test("GET /api/v1/categories/:id - returns category by id", async () => {
    const create = await ctx.post("/api/v1/categories", {
      data: { name: "Get Test", slug: "get-test" },
    });
    const created = await create.json();
    const res = await ctx.get(`/api/v1/categories/${created.id}`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Get Test");
  });

  test("PATCH /api/v1/categories/:id - updates category", async () => {
    const create = await ctx.post("/api/v1/categories", {
      data: { name: "Before", slug: "before" },
    });
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/categories/${created.id}`, {
      data: { name: "After" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("After");
  });

  test("PATCH /api/v1/categories/:id - archive/restore", async () => {
    const create = await ctx.post("/api/v1/categories", {
      data: { name: "Archive Test", slug: "archive-test" },
    });
    const created = await create.json();
    const archive = await ctx.patch(`/api/v1/categories/${created.id}`, {
      data: { action: "archive" },
    });
    expect(archive.ok()).toBe(true);
    const restore = await ctx.patch(`/api/v1/categories/${created.id}`, {
      data: { action: "restore" },
    });
    expect(restore.ok()).toBe(true);
  });

  test("DELETE /api/v1/categories/:id - deletes category", async () => {
    const create = await ctx.post("/api/v1/categories", {
      data: { name: "Delete Test", slug: "delete-test" },
    });
    const created = await create.json();
    const res = await ctx.delete(`/api/v1/categories/${created.id}`);
    expect(res.ok()).toBe(true);
    const get = await ctx.get(`/api/v1/categories/${created.id}`);
    expect(get.status()).toBe(404);
  });

  test("POST /api/v1/categories - validates required fields", async () => {
    const res = await ctx.post("/api/v1/categories", { data: {} });
    expect(res.status()).toBe(400);
  });
});
```

- [ ] **Step 2: Run test**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Categories API"`
Expected: All tests PASS

### Task 2: Products API tests

**Files:**

- Create: `src/__tests__/e2e/products.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant, unauthContext } from "./helpers/auth";

test.describe("Products API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/products - returns list", async () => {
    const res = await ctx.get("/api/v1/products");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/products - requires auth", async () => {
    const unauth = await unauthContext();
    const res = await unauth.get("/api/v1/products");
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/products - creates a product", async () => {
    const res = await ctx.post("/api/v1/products", {
      data: {
        name: "Test Product",
        slug: "test-product",
        status: "active",
        images: [{ url: "https://example.com/img.jpg", alt: "test", sortOrder: 0 }],
        variants: [{ sku: "TP-001", price: 19.99, quantity: 10, isDefault: true, status: "active" }],
        options: [],
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Test Product");
    expect(body.status).toBe("active");
  });

  test("POST /api/v1/products - validates required fields", async () => {
    const res = await ctx.post("/api/v1/products", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/products/:id - returns product by id", async () => {
    const create = await ctx.post("/api/v1/products", {
      data: {
        name: "Get Prod",
        slug: "get-prod",
        status: "active",
        images: [],
        variants: [{ sku: "GP-001", price: 9.99, quantity: 5, isDefault: true, status: "active" }],
        options: [],
      },
    });
    const created = await create.json();
    const res = await ctx.get(`/api/v1/products/${created.id}`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Get Prod");
  });

  test("PATCH /api/v1/products/:id - updates product", async () => {
    const create = await ctx.post("/api/v1/products", {
      data: {
        name: "Before", slug: "before-prod", status: "draft",
        images: [], variants: [{ sku: "BP-001", price: 1, quantity: 1, isDefault: true, status: "active" }], options: [],
      },
    });
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/products/${created.id}`, {
      data: { name: "After", status: "active" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("After");
  });

  test("DELETE /api/v1/products/:id - soft deletes", async () => {
    const create = await ctx.post("/api/v1/products", {
      data: {
        name: "Del Prod", slug: "del-prod", status: "draft",
        images: [], variants: [{ sku: "DP-001", price: 1, quantity: 1, isDefault: true, status: "active" }], options: [],
      },
    });
    const created = await create.json();
    const res = await ctx.delete(`/api/v1/products/${created.id}`);
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Products API"`
Expected: All tests PASS

### Task 3: Auth API tests

**Files:**

- Create: `src/__tests__/e2e/auth.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Auth API", () => {
  test("POST /api/auth/register - registers a new user", async () => {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@test.com", password: "password123", name: "New User", role: "merchant" }),
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.user.email).toBe("new@test.com");
  });

  test("POST /api/auth/register - rejects duplicate email", async () => {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dupe@test.com", password: "password123", name: "Dupe", role: "merchant" }),
    });
    expect(res.ok()).toBe(true);
    const dupe = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dupe@test.com", password: "other123", name: "Dupe Again", role: "merchant" }),
    });
    expect(dupe.status).toBe(409);
  });

  test("POST /api/auth/login - logs in with correct credentials", async () => {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@test.com", password: "password123" }),
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.user.email).toBe("merchant@test.com");
  });

  test("POST /api/auth/login - rejects wrong password", async () => {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@test.com", password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me - returns current user", async () => {
    const login = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@test.com", password: "password123" }),
    });
    const cookies = login.headers.get("set-cookie") || "";
    const res = await fetch("http://localhost:3000/api/auth/me", {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.loggedIn).toBe(true);
  });

  test("GET /api/auth/me - returns not logged in without cookie", async () => {
    const res = await fetch("http://localhost:3000/api/auth/me");
    const body = await res.json();
    expect(body.loggedIn).toBe(false);
  });

  test("POST /api/auth/logout - clears session", async () => {
    const login = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@test.com", password: "password123" }),
    });
    const cookies = login.headers.get("set-cookie") || "";
    const res = await fetch("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const me = await fetch("http://localhost:3000/api/auth/me", {
      headers: { Cookie: cookies },
    });
    const meBody = await me.json();
    expect(meBody.loggedIn).toBe(false);
  });
});
```

- [ ] **Step 2: Run test**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Auth API"`
Expected: All tests PASS

### Task 4: Cart API tests

**Files:**

- Create: `src/__tests__/e2e/cart.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Cart API", () => {
  test("GET /api/v1/cart - returns empty cart", async () => {
    const res = await fetch("http://localhost:3000/api/v1/cart", {
      headers: { "x-tenant-id": "t-1" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test("POST /api/v1/cart - adds item", async () => {
    const res = await fetch("http://localhost:3000/api/v1/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tenant-id": "t-1" },
      body: JSON.stringify({ variantId: "var-1", quantity: 2 }),
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
  });

  test("POST /api/v1/cart - validates variant id", async () => {
    const res = await fetch("http://localhost:3000/api/v1/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tenant-id": "t-1" },
      body: JSON.stringify({ quantity: 1 }),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Cart API"`
Expected: All tests PASS

### Task 5: Coupons API tests

**Files:**

- Create: `src/__tests__/e2e/coupons.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant, unauthContext } from "./helpers/auth";

test.describe("Coupons API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/coupons - returns list", async () => {
    const res = await ctx.get("/api/v1/coupons");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/coupons - creates a coupon", async () => {
    const res = await ctx.post("/api/v1/coupons", {
      data: { code: "TEST10", type: "fixed", value: 10, startsAt: new Date().toISOString() },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.code).toBe("TEST10");
  });

  test("POST /api/v1/coupons - rejects duplicate code", async () => {
    await ctx.post("/api/v1/coupons", {
      data: { code: "UNIQUE", type: "fixed", value: 5, startsAt: new Date().toISOString() },
    });
    const res = await ctx.post("/api/v1/coupons", {
      data: { code: "UNIQUE", type: "fixed", value: 5, startsAt: new Date().toISOString() },
    });
    expect(res.status()).toBe(409);
  });

  test("POST /api/v1/coupons - validates required fields", async () => {
    const res = await ctx.post("/api/v1/coupons", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/coupons/:id - returns coupon", async () => {
    const create = await ctx.post("/api/v1/coupons", {
      data: { code: "GETME", type: "percentage", value: 15, startsAt: new Date().toISOString() },
    });
    const created = await create.json();
    const res = await ctx.get(`/api/v1/coupons/${created.id}`);
    expect(res.ok()).toBe(true);
  });

  test("PATCH /api/v1/coupons/:id - updates coupon", async () => {
    const create = await ctx.post("/api/v1/coupons", {
      data: { code: "PATCHME", type: "fixed", value: 5, startsAt: new Date().toISOString() },
    });
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/coupons/${created.id}`, { data: { value: 20 } });
    expect(res.ok()).toBe(true);
  });

  test("DELETE /api/v1/coupons/:id - deletes coupon", async () => {
    const create = await ctx.post("/api/v1/coupons", {
      data: { code: "DELETEME", type: "fixed", value: 1, startsAt: new Date().toISOString() },
    });
    const created = await create.json();
    const res = await ctx.delete(`/api/v1/coupons/${created.id}`);
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Coupons API"`
Expected: All tests PASS

### Task 6: Promotions API tests

**Files:**

- Create: `src/__tests__/e2e/promotions.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Promotions API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/promotions - returns list", async () => {
    const res = await ctx.get("/api/v1/promotions");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/promotions - creates a promotion", async () => {
    const res = await ctx.post("/api/v1/promotions", {
      data: {
        name: "Summer Sale", discountType: "percentage", discountValue: 10,
        startsAt: new Date().toISOString(),
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Summer Sale");
  });

  test("POST /api/v1/promotions - validates required fields", async () => {
    const res = await ctx.post("/api/v1/promotions", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("PATCH /api/v1/promotions/:id - updates promotion", async () => {
    const create = await ctx.post("/api/v1/promotions", {
      data: {
        name: "Old Sale", discountType: "fixed", discountValue: 5,
        startsAt: new Date().toISOString(),
      },
    });
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/promotions/${created.id}`, { data: { name: "New Sale" } });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("New Sale");
  });
});
```

- [ ] **Step 2: Run test**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Promotions API"`
Expected: All tests PASS

### Task 7: Orders API tests

**Files:**

- Create: `src/__tests__/e2e/orders.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Orders API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/orders - returns list", async () => {
    const res = await ctx.get("/api/v1/orders");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/orders - requires auth", async () => {
    const res = await fetch("http://localhost:3000/api/v1/orders");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Orders API"`
Expected: All tests PASS

### Task 8: Customers, Inventory, Settings, Shipping API tests

**Files:**

- Create: `src/__tests__/e2e/customers.spec.ts`
- Create: `src/__tests__/e2e/inventory.spec.ts`
- Create: `src/__tests__/e2e/settings.spec.ts`
- Create: `src/__tests__/e2e/shipping.spec.ts`

- [ ] **Step 1: Customers tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Customers API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/customers - returns list", async () => {
    const res = await ctx.get("/api/v1/customers");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/customers - requires auth", async () => {
    const res = await fetch("http://localhost:3000/api/v1/customers");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Inventory tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Inventory API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/inventory - returns list", async () => {
    const res = await ctx.get("/api/v1/inventory");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/inventory - adjusts stock", async () => {
    const res = await ctx.post("/api/v1/inventory", {
      data: { variantId: "var-1", change: 10, reason: "Restock" },
    });
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/inventory - validates change", async () => {
    const res = await ctx.post("/api/v1/inventory", { data: { variantId: "var-1" } });
    expect(res.status()).toBe(400);
  });
});
```

- [ ] **Step 3: Settings tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Settings API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/settings - returns settings", async () => {
    const res = await ctx.get("/api/v1/settings");
    expect(res.ok()).toBe(true);
  });

  test("PUT /api/v1/settings - updates store info", async () => {
    const res = await ctx.put("/api/v1/settings", {
      data: { storeInfo: { name: "Updated Store" }, domains: { subdomain: "updated" } },
    });
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 4: Shipping tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Shipping API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/shipping - returns zones", async () => {
    const res = await ctx.get("/api/v1/shipping");
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/shipping - validates required fields", async () => {
    const res = await ctx.post("/api/v1/shipping", { data: {} });
    expect(res.status()).toBe(400);
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Customers API|Inventory API|Settings API|Shipping API"`
Expected: All tests PASS

### Task 9: Wishlist, Reviews, Tax, Warehouse API tests

**Files:**

- Create: `src/__tests__/e2e/wishlist.spec.ts`
- Create: `src/__tests__/e2e/reviews.spec.ts`
- Create: `src/__tests__/e2e/tax.spec.ts`
- Create: `src/__tests__/e2e/warehouses.spec.ts`

- [ ] **Step 1: Wishlist tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Wishlist API", () => {
  test("GET /api/v1/wishlist - returns wishlist", async () => {
    const res = await fetch("http://localhost:3000/api/v1/wishlist", {
      headers: { "x-tenant-id": "t-1" },
    });
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 2: Reviews tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Reviews API", () => {
  test("GET /api/v1/reviews - returns list", async () => {
    const res = await fetch("http://localhost:3000/api/v1/reviews", {
      headers: { "x-tenant-id": "t-1" },
    });
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 3: Tax tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Tax API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/tax - returns zones", async () => {
    const res = await ctx.get("/api/v1/tax");
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/tax - creates a tax zone", async () => {
    const res = await ctx.post("/api/v1/tax", {
      data: { name: "US Tax", type: "country", country: "US" },
    });
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 4: Warehouses tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Warehouses API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/warehouses - returns list", async () => {
    const res = await ctx.get("/api/v1/warehouses");
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/warehouses - creates warehouse", async () => {
    const res = await ctx.post("/api/v1/warehouses", {
      data: { name: "Main Warehouse", code: "MAIN" },
    });
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Wishlist API|Reviews API|Tax API|Warehouses API"`
Expected: All tests PASS

### Task 10: Account Profile, Addresses, CMS, Checkout API tests

**Files:**

- Create: `src/__tests__/e2e/account.spec.ts`
- Create: `src/__tests__/e2e/addresses.spec.ts`
- Create: `src/__tests__/e2e/cms.spec.ts`
- Create: `src/__tests__/e2e/checkout.spec.ts`

- [ ] **Step 1: Account profile tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Account API", () => {
  test("GET /api/v1/account/profile - requires auth", async () => {
    const res = await fetch("http://localhost:3000/api/v1/account/profile");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Addresses tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Addresses API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/addresses - returns list", async () => {
    const res = await ctx.get("/api/v1/addresses");
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 3: CMS tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("CMS API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/cms/pages - returns pages", async () => {
    const res = await ctx.get("/api/v1/cms/pages");
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 4: Checkout tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Checkout API", () => {
  test("POST /api/v1/checkout - validates cart", async () => {
    const res = await fetch("http://localhost:3000/api/v1/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tenant-id": "t-1" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Account API|Addresses API|CMS API|Checkout API"`
Expected: All tests PASS

### Task 11: Billing, Notifications, Analytics, Admin API tests

**Files:**

- Create: `src/__tests__/e2e/billing.spec.ts`
- Create: `src/__tests__/e2e/notifications.spec.ts`
- Create: `src/__tests__/e2e/analytics.spec.ts`
- Create: `src/__tests__/e2e/admin.spec.ts`

- [ ] **Step 1: Billing tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Billing API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/billing - returns subscription info", async () => {
    const res = await ctx.get("/api/v1/billing");
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 2: Notifications tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Notifications API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/notifications - returns list", async () => {
    const res = await ctx.get("/api/v1/notifications");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });
});
```

- [ ] **Step 3: Analytics tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Analytics API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/analytics/dashboard - returns dashboard data", async () => {
    const res = await ctx.get("/api/v1/analytics/dashboard");
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 4: Admin tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    ctx = await loginAsAdmin();
  });

  test("GET /api/v1/admin/tenants - returns tenants", async () => {
    const res = await ctx.get("/api/v1/admin/tenants");
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/admin/tenants - rejects non-admin", async () => {
    const merchant = await (await import("./helpers/auth")).loginAsMerchant();
    const res = await merchant.get("/api/v1/admin/tenants");
    expect(res.status()).toBe(403);
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Billing API|Notifications API|Analytics API|Admin API"`
Expected: All tests PASS

### Task 12: Health, Metrics, Upload, Webhooks API tests

**Files:**

- Create: `src/__tests__/e2e/health.spec.ts`
- Create: `src/__tests__/e2e/metrics.spec.ts`
- Create: `src/__tests__/e2e/upload.spec.ts`
- Create: `src/__tests__/e2e/webhooks.spec.ts`

- [ ] **Step 1: Health tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Health API", () => {
  test("GET /api/v1/health - returns ok", async () => {
    const res = await fetch("http://localhost:3000/api/v1/health");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
```

- [ ] **Step 2: Metrics tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Metrics API", () => {
  test("GET /api/v1/metrics - returns queue metrics", async () => {
    const res = await fetch("http://localhost:3000/api/v1/metrics");
    expect(res.ok()).toBe(true);
  });
});
```

- [ ] **Step 3: Upload tests**

```ts
import { test, expect } from "@playwright/test";

test.describe("Upload API", () => {
  test("POST /api/v1/upload - validates file", async () => {
    const res = await fetch("http://localhost:3000/api/v1/upload", { method: "POST" });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 4: Webhooks tests**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Webhooks API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/webhooks - returns list", async () => {
    const res = await ctx.get("/api/v1/webhooks");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e -- --grep "Health API|Metrics API|Upload API|Webhooks API"`
Expected: All tests PASS

### Task 13: Full suite smoke test

- [ ] **Step 1: Run all e2e tests**

Run: `cd /home/rch/Programming/Projects/CloudCommerce && bun run test:e2e`
Expected: All tests PASS (or known failures documented)
