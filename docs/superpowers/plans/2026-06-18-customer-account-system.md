# Customer Account System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build customer account system with registration, login, profile management, address CRUD, and order history for storefront shoppers.

**Architecture:** Reuse existing `User` + `Session` auth system. New API under `/api/v1/account/*` session-authenticated. Store-specific auth pages at `/store/{tenant}/auth/*`. Address model extended with optional `userId`. Existing `Customer` record auto-created on registration for order linking.

**Tech Stack:** Next.js 16 App Router, Prisma v7, React Hook Form v7, Zod v4, shadcn/ui, Tailwind CSS v4.

---

### Task 1: Schema migration + Zod schemas

**Files:**
- Modify: `prisma/schema.prisma` (Address model, User model)
- Modify: `src/lib/schemas.ts` (new Zod schemas)

- [ ] **Step 1: Add `phone` to User model and `userId` to Address model**

Edit `prisma/schema.prisma`, add `phone String?` to User model after `name`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  phone     String?   // NEW — for customer profiles
  role      String   @default("customer")
  tenantId  String?
```

Then add `userId String?` field and `user User?` relation to the Address model, plus an index:

```prisma
model Address {
  id         String   @id @default(cuid())
  customerId String?
  userId     String?                         // NEW
  label      String   @default("Home")
  line1      String
  line2      String?
  city       String
  state      String
  zip        String
  country    String   @default("US")
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  customer Customer? @relation(fields: [customerId], references: [id], onDelete: Cascade)
  user     User?     @relation(fields: [userId], references: [id])         // NEW

  @@index([userId])                                                         // NEW
}
```

- [ ] **Step 2: Add `addresses` relation to User model**

Edit `prisma/schema.prisma`, User model, add after `sessions Session[]`:

```prisma
  sessions  Session[]
  addresses Address[]   // NEW
```

- [ ] **Step 3: Update `getSessionUser()` to include `tenantId`**

Edit `src/lib/get-session.ts`, add `tenantId` to the `SessionUser` interface and its select:

```typescript
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
}
```

Update the select in the same file:

```typescript
include: { user: { select: { id: true, email: true, name: true, role: true, tenantId: true } } },
```

- [ ] **Step 4: Create and apply migration**

```bash
npx prisma migrate dev --name add_customer_account_fields
```

Expected: Migration created and applied successfully.

- [ ] **Step 5: Add customer Zod schemas**

Add to `src/lib/schemas.ts` after the existing `addressSchema` block (before `cartItemSchema`):

```typescript
export const customerRegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
```

Add type exports after the existing type exports in the same file:

```typescript
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/schemas.ts src/lib/get-session.ts
git commit -m "feat: add customer account fields to User/Address models and Zod schemas"
```

---

### Task 2: Customer auth API routes (register, login, logout)

**Files:**
- Create: `src/app/api/v1/auth/customer/register/route.ts`
- Create: `src/app/api/v1/auth/customer/login/route.ts`
- Create: `src/app/api/v1/auth/customer/logout/route.ts`

- [ ] **Step 1: Create register route**

Create `src/app/api/v1/auth/customer/register/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateSessionToken, getSessionExpiry, setSessionCookie } from "@/lib/auth";
import { customerRegisterSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = customerRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const tenantId = body.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: "customer", tenantId },
    });

    // Create Customer record for order linking
    const existingCustomer = await prisma.customer.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });
    if (!existingCustomer) {
      await prisma.customer.create({
        data: { email, name, tenantId },
      });
    }

    const token = generateSessionToken();
    await prisma.session.create({
      data: { userId: user.id, token, expiresAt: getSessionExpiry() },
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create login route**

Create `src/app/api/v1/auth/customer/login/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateSessionToken, getSessionExpiry, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== "customer") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = generateSessionToken();
    await prisma.session.create({
      data: { userId: user.id, token, expiresAt: getSessionExpiry() },
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create logout route**

Create `src/app/api/v1/auth/customer/logout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionToken, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const token = await getSessionToken();
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/auth/customer/
git commit -m "feat: add customer auth API routes (register, login, logout)"
```

---

### Task 3: Account profile API

**Files:**
- Create: `src/app/api/v1/account/profile/route.ts`

- [ ] **Step 1: Create profile route (GET + PUT)**

Create `src/app/api/v1/account/profile/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { profileUpdateSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: { ...parsed.data, phone: parsed.data.phone ?? null },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/v1/account/profile/
git commit -m "feat: add account profile API (GET + PUT)"
```

---

### Task 4: Account orders API

**Files:**
- Create: `src/app/api/v1/account/orders/route.ts`
- Create: `src/app/api/v1/account/orders/[id]/route.ts`

- [ ] **Step 1: Create orders list route**

Create `src/app/api/v1/account/orders/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const skip = (page - 1) * limit;

  const customer = await prisma.customer.findUnique({
    where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
  });

  if (!customer) {
    return NextResponse.json({ orders: [], total: 0, page, limit });
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where: { customerId: customer.id } }),
  ]);

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      items: o._count.items,
      date: o.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
}
```

- [ ] **Step 2: Create order detail route**

Create `src/app/api/v1/account/orders/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.findFirst({
    where: { id, customerId: customer.id },
    include: {
      items: true,
      address: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ order });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/account/orders/
git commit -m "feat: add account orders API (list + detail)"
```

---

### Task 5: Account addresses API

**Files:**
- Create: `src/app/api/v1/account/addresses/route.ts`
- Create: `src/app/api/v1/account/addresses/[id]/route.ts`
- Create: `src/app/api/v1/account/addresses/[id]/default/route.ts`

- [ ] **Step 1: Create addresses list + create route**

Create `src/app/api/v1/account/addresses/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { addressSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const addresses = await prisma.address.findMany({
    where: { userId: session.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...parsed.data, line2: parsed.data.line2 ?? null, userId: session.id },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create address item route (PUT + DELETE)**

Create `src/app/api/v1/account/addresses/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { addressSchema } from "@/lib/schemas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await request.json();
    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(address);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create set-default route**

Create `src/app/api/v1/account/addresses/[id]/default/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.address.updateMany({
    where: { userId: session.id, isDefault: true },
    data: { isDefault: false },
  });

  const address = await prisma.address.update({
    where: { id },
    data: { isDefault: true },
  });

  return NextResponse.json(address);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/account/addresses/
git commit -m "feat: add account addresses API (CRUD + default)"
```

---

### Task 6: Customer auth pages (login + register)

**Files:**
- Create: `src/app/(storefront)/store/[tenant]/auth/login/page.tsx`
- Create: `src/app/(storefront)/store/[tenant]/auth/register/page.tsx`

- [ ] **Step 1: Create login page**

Create `src/app/(storefront)/store/[tenant]/auth/login/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function CustomerLoginPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      const redirect = searchParams.get("redirect") || `/store/${tenant}/account`;
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-8">Access your account to manage orders and addresses.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
            placeholder="Enter your password"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#7C3AED] py-2.5 text-sm font-semibold text-white hover:bg-[#8B5CF6] disabled:opacity-40 transition-colors"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={`/store/${tenant}/auth/register`} className="font-medium text-violet-400 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create register page**

Create `src/app/(storefront)/store/[tenant]/auth/register/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function CustomerRegisterPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, tenantId: tenant }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push(`/store/${tenant}/account`);
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Create account</h1>
      <p className="text-sm text-muted-foreground mb-8">Register to manage your orders and addresses.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#7C3AED] py-2.5 text-sm font-semibold text-white hover:bg-[#8B5CF6] disabled:opacity-40 transition-colors"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/store/${tenant}/auth/login`} className="font-medium text-violet-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(storefront\)/store/\[tenant\]/auth/
git commit -m "feat: add customer auth pages (login + register)"
```

---

### Task 7: Account layout with auth guard + profile page

**Files:**
- Modify: `src/app/(storefront)/store/[tenant]/account/layout.tsx`
- Modify: `src/app/(storefront)/store/[tenant]/account/page.tsx`
- Create: `src/app/(storefront)/store/[tenant]/account/profile/page.tsx`

- [ ] **Step 1: Update account layout with auth guard**

Rewrite `src/app/(storefront)/store/[tenant]/account/layout.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Package, MapPin, User, LogOut, Loader2 } from "lucide-react";
import { use } from "react";

export default function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const base = `/store/${tenant}/account`;

  useEffect(() => {
    fetch("/api/v1/account/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        setAuthed(true);
      })
      .catch(() => {
        const redirect = encodeURIComponent(pathname);
        router.push(`/store/${tenant}/auth/login?redirect=${redirect}`);
      });
  }, [tenant, router, pathname]);

  if (authed === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nav = [
    { href: base, label: "Profile", icon: User, exact: true },
    { href: `${base}/orders`, label: "Orders", icon: Package },
    { href: `${base}/addresses`, label: "Addresses", icon: MapPin },
  ];

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-6">My Account</h1>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(item)
                    ? "bg-[#7C3AED]/10 text-[#7C3AED] font-medium"
                    : "text-muted-foreground hover:bg-card hover:text-[#F8FAFC]"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
          <hr className="my-2 border-border" />
          <Link
            href={`/store/${tenant}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-card hover:text-rose-400 transition-colors"
          >
            <LogOut size={16} />
            Back to Store
          </Link>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update account index page to redirect to profile**

Rewrite `src/app/(storefront)/store/[tenant]/account/page.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = params.tenant as string;

  useEffect(() => {
    router.replace(`/store/${tenant}/account/profile`);
  }, [router, tenant]);

  return null;
}
```

- [ ] **Step 3: Create profile page**

Create `src/app/(storefront)/store/[tenant]/account/profile/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

export default function AccountProfilePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/account/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone || "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/v1/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Update failed");
        return;
      }
      toast.success("Profile updated");
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage your account information.</p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1.5">
            <User size={14} /> Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1.5">
            <Mail size={14} /> Email
          </label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2.5 text-sm text-muted-foreground outline-none cursor-not-allowed opacity-60"
          />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1.5">
            <Phone size={14} /> Phone (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6] disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(storefront\)/store/\[tenant\]/account/
git commit -m "feat: add account auth guard and profile page"
```

---

### Task 8: Orders pages (list + detail)

**Files:**
- Rewrite: `src/app/(storefront)/store/[tenant]/account/orders/page.tsx`
- Create: `src/app/(storefront)/store/[tenant]/account/orders/[id]/page.tsx`

- [ ] **Step 1: Rewrite orders list page with real data**

Rewrite `src/app/(storefront)/store/[tenant]/account/orders/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { Package, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10",
  confirmed: "text-sky-400 bg-sky-500/10",
  shipped: "text-blue-400 bg-blue-500/10",
  delivered: "text-emerald-400 bg-emerald-500/10",
  cancelled: "text-rose-400 bg-rose-500/10",
};

interface Order {
  id: string;
  number: string;
  status: string;
  total: number;
  items: number;
  date: string;
}

export default function AccountOrdersPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = use(params);
  const base = `/store/${tenant}/account`;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/account/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-32 bg-muted rounded mb-2" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#F8FAFC]">Order History</h2>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <Package size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders yet</p>
          <Link
            href={`/store/${tenant}/products`}
            className="mt-4 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        orders.map((order) => (
          <Link
            key={order.id}
            href={`${base}/orders/${order.id}`}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-violet-500/30 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-[#F8FAFC]">#{order.number}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    statusColors[order.status] || "text-muted-foreground"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {order.items} item{order.items !== 1 ? "s" : ""} &middot; ${Number(order.total).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </Link>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create order detail page**

Create `src/app/(storefront)/store/[tenant]/account/orders/[id]/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { use, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10",
  confirmed: "text-sky-400 bg-sky-500/10",
  shipped: "text-blue-400 bg-blue-500/10",
  delivered: "text-emerald-400 bg-emerald-500/10",
  cancelled: "text-rose-400 bg-rose-500/10",
};

interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface OrderAddress {
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Order {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  address: OrderAddress | null;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/account/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setOrder(data.order))
      .catch(() => {
        toast.error("Order not found");
        router.push(`/store/${tenant}/account/orders`);
      })
      .finally(() => setLoading(false));
  }, [id, tenant, router]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded-xl" />
        <div className="h-24 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/store/${tenant}/account/orders`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-[#F8FAFC] transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to orders
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#F8FAFC] font-mono">#{order.number}</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusColors[order.status] || "text-muted-foreground"
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Placed {new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-[#F8FAFC]">Items</h3>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              {item.image ? (
                <img src={item.image} alt={item.productName} className="h-14 w-14 rounded-lg object-cover bg-muted" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                  <Package size={20} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F8FAFC] truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#F8FAFC]">${Number(item.price).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-[#F8FAFC] mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{Number(order.shipping) === 0 ? "Free" : `$${Number(order.shipping).toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>${Number(order.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-medium text-[#F8FAFC]">
            <span>Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.address && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-[#F8FAFC] mb-3">Shipping Address</h3>
          <p className="text-sm text-muted-foreground">
            {order.address.label && <span className="font-medium text-[#F8FAFC]">{order.address.label}</span>}
            <br />
            {order.address.line1}
            {order.address.line2 && <><br />{order.address.line2}</>}
            <br />
            {order.address.city}, {order.address.state} {order.address.zip}
            <br />
            {order.address.country}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(storefront\)/store/\[tenant\]/account/orders/
git commit -m "feat: add order history pages (list + detail)"
```

---

### Task 9: Addresses page with CRUD Sheet

**Files:**
- Modify: `src/app/(storefront)/store/[tenant]/account/addresses/page.tsx`

- [ ] **Step 1: Rewrite addresses page with real CRUD**

Rewrite `src/app/(storefront)/store/[tenant]/account/addresses/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { MapPin, Plus, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

const defaultForm = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  isDefault: false,
};

export default function AccountAddressesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = use(params);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  function resetForm() {
    setForm(defaultForm);
    setEditingId(null);
    setError("");
  }

  function openEdit(addr: Address) {
    setForm({
      label: addr.label,
      line1: addr.line1,
      line2: addr.line2 || "",
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  }

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/v1/account/addresses");
      const data = await res.json();
      setAddresses(data);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!form.line1 || !form.city || !form.state || !form.zip) {
      setError("Please fill in all required fields");
      setSaving(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/v1/account/addresses/${editingId}`
        : "/api/v1/account/addresses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          line2: form.line2 || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save address");
        return;
      }

      toast.success(editingId ? "Address updated" : "Address added");
      setShowForm(false);
      resetForm();
      fetchAddresses();
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;

    try {
      const res = await fetch(`/api/v1/account/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/v1/account/addresses/${id}/default`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to set default");
      toast.success("Default address updated");
      fetchAddresses();
    } catch {
      toast.error("Failed to set default address");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#F8FAFC]">Addresses</h2>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8B5CF6] transition-colors"
          >
            <Plus size={14} /> Add Address
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Label</label>
              <select
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-violet-500"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Address line 1 *</label>
              <input
                type="text"
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
                placeholder="123 Main St"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Address line 2 (optional)</label>
              <input
                type="text"
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
                placeholder="Apt, Suite, etc."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">State *</label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-violet-500"
              >
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ZIP *</label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded border-border bg-card"
            />
            Set as default address
          </label>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-medium text-white hover:bg-[#8B5CF6] disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:text-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
              <div className="h-4 w-24 bg-muted rounded mb-2" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <MapPin size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No saved addresses</p>
        </div>
      ) : (
        addresses.map((addr) => (
          <div key={addr.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#F8FAFC]">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-[#7C3AED]/20 px-2 py-0.5 text-[10px] font-medium text-[#7C3AED]">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{addr.line1}</p>
                {addr.line2 && <p className="text-sm text-muted-foreground">{addr.line2}</p>}
                <p className="text-sm text-muted-foreground">
                  {addr.city}, {addr.state} {addr.zip}
                </p>
                <p className="text-sm text-muted-foreground">{addr.country}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Set as default"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  className="rounded-lg p-2 text-muted-foreground hover:text-[#F8FAFC] hover:bg-card transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(storefront\)/store/\[tenant\]/account/addresses/
git commit -m "feat: add addresses page with inline CRUD"
```

---

### Task 10: Wire up proxy.ts for account API paths + final verification

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Add `/api/v1/account/` to proxy auth skip logic**

Since account API routes are authenticated internally (they call `getSessionUser()`), they don't need the proxy to redirect. But we should ensure the proxy doesn't double-intercept. Check `src/proxy.ts` line 46:

The proxy currently skips auth for `/auth/login`, `/auth/register`, `/api/auth/`. We should also skip for `/api/v1/account/` since these routes handle their own auth:

Edit `src/proxy.ts`, add to `AUTH_SKIP_PATHS`:

```typescript
const AUTH_SKIP_PATHS = ["/auth/login", "/auth/register", "/api/auth/", "/api/v1/auth/customer/", "/api/v1/account/"];
```

- [ ] **Step 2: Run build to verify no errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck 2>&1 | tail -20
```

Expected: TypeScript compiles without errors.

- [ ] **Step 4: Commit final changes**

```bash
git add src/proxy.ts
git commit -m "chore: add account API paths to proxy auth skip list"
```
