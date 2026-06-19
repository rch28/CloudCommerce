# Discount Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Production-grade discount engine with coupon codes, rule-based promotions, checkout validation, and audit trail.

**Architecture:** Pure `DiscountEngine` (stateless validation + calculation) + `CouponUsageService` (side-effect writes) pattern. API routes call engine, then usage service. Checkout flow validates coupon before order creation.

**Tech Stack:** Prisma 7 + PostgreSQL, Zod 4, Next.js 16 App Router, React 19, shadcn/ui, TypeScript 6.

---

### Task 1: Prisma Schema — Add models + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260619_discount_engine/migration.sql`

- [ ] **Step 1: Add Coupon, Promotion, PromotionRule, PromotionUsage models to schema.prisma**

Insert before the closing `}` of the schema (before any generator/datasource blocks — actually add after the last existing model `WebhookLog`).

```prisma
model Coupon {
  id              String   @id @default(cuid())
  code            String
  type            String   // fixed | percentage | free_shipping
  value           Decimal
  maxDiscount     Decimal?
  minOrderAmount  Decimal?
  maxUses         Int?
  currentUses     Int      @default(0)
  appliesTo       String   @default("all") // all | products | categories | customers
  productIds      String[]
  categoryIds     String[]
  customerIds     String[]
  firstOrderOnly  Boolean  @default(false)
  startsAt        DateTime
  expiresAt       DateTime?
  isActive        Boolean  @default(true)
  tenantId        String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([code, tenantId])
  @@index([tenantId])
}

model Promotion {
  id            String   @id @default(cuid())
  name          String
  description   String?
  type          String   // automatic | cart_rule
  priority      Int      @default(0)
  discountType  String   // fixed | percentage | free_shipping
  discountValue Decimal
  maxDiscount   Decimal?
  startsAt      DateTime
  expiresAt     DateTime?
  isActive      Boolean  @default(true)
  tenantId      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant Tenant          @relation(fields: [tenantId], references: [id])
  rules  PromotionRule[]
  usages PromotionUsage[]

  @@index([tenantId])
}

model PromotionRule {
  id          String @id @default(cuid())
  promotionId String
  type        String // min_amount | product | category | customer | first_order
  value       String // JSON config
  tenantId    String
  createdAt   DateTime @default(now())

  promotion Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)

  @@index([promotionId])
}

model PromotionUsage {
  id             String   @id @default(cuid())
  promotionId    String?
  couponId       String?
  orderId        String
  customerId     String?
  discountAmount Decimal
  discountType   String   // fixed | percentage | free_shipping
  discountCode   String?
  tenantId       String
  createdAt      DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([promotionId])
  @@index([couponId])
  @@index([orderId])
  @@index([tenantId])
}
```

- [ ] **Step 2: Add discount fields to existing Order model**

Find the `model Order {` block and add after `total` field:

```prisma
  discountAmount Decimal   @default(0)
  discountCode   String?
  discountType   String?
```

- [ ] **Step 3: Create migration SQL**

```sql
-- Discount Engine: Coupons, Promotions, PromotionRules, PromotionUsage

CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "maxDiscount" DECIMAL(65,30),
    "minOrderAmount" DECIMAL(65,30),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "appliesTo" TEXT NOT NULL DEFAULT 'all',
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Coupon_code_tenantId_key" UNIQUE ("code", "tenantId")
);

CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "maxDiscount" DECIMAL(65,30),
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromotionRule" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromotionUsage" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT,
    "couponId" TEXT,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT,
    "discountAmount" DECIMAL(65,30) NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountCode" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionUsage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountType" TEXT;

CREATE INDEX IF NOT EXISTS "Coupon_tenantId_idx" ON "Coupon"("tenantId");
CREATE INDEX IF NOT EXISTS "Promotion_tenantId_idx" ON "Promotion"("tenantId");
CREATE INDEX IF NOT EXISTS "PromotionRule_promotionId_idx" ON "PromotionRule"("promotionId");
CREATE INDEX IF NOT EXISTS "PromotionUsage_promotionId_idx" ON "PromotionUsage"("promotionId");
CREATE INDEX IF NOT EXISTS "PromotionUsage_couponId_idx" ON "PromotionUsage"("couponId");
CREATE INDEX IF NOT EXISTS "PromotionUsage_orderId_idx" ON "PromotionUsage"("orderId");
CREATE INDEX IF NOT EXISTS "PromotionUsage_tenantId_idx" ON "PromotionUsage"("tenantId");

ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromotionRule" ADD CONSTRAINT "PromotionRule_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionUsage" ADD CONSTRAINT "PromotionUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 4: Generate Prisma client**

```bash
bunx prisma generate
```

Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260619_discount_engine/
git commit -m "feat(discounts): add Coupon, Promotion, PromotionRule, PromotionUsage models"
```

---

### Task 2: Zod Schemas

**Files:**
- Modify: `src/lib/schemas.ts`

- [ ] **Step 1: Add couponSchema and promotionSchema**

Add to `src/lib/schemas.ts`, after existing schemas:

```ts
export const couponSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  type: z.enum(["fixed", "percentage", "free_shipping"]),
  value: z.coerce.number().positive(),
  maxDiscount: z.coerce.number().positive().optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  appliesTo: z.enum(["all", "products", "categories", "customers"]).default("all"),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  customerIds: z.array(z.string()).default([]),
  firstOrderOnly: z.boolean().default(false),
  startsAt: z.union([z.string().datetime(), z.date()]),
  expiresAt: z.union([z.string().datetime(), z.date()]).optional(),
  isActive: z.boolean().default(true),
});

export type CouponInput = z.infer<typeof couponSchema>;

export const promotionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["automatic", "cart_rule"]).default("automatic"),
  priority: z.coerce.number().int().default(0),
  discountType: z.enum(["fixed", "percentage", "free_shipping"]),
  discountValue: z.coerce.number().positive(),
  maxDiscount: z.coerce.number().positive().optional(),
  startsAt: z.union([z.string().datetime(), z.date()]),
  expiresAt: z.union([z.string().datetime(), z.date()]).optional(),
  isActive: z.boolean().default(true),
  rules: z.array(z.object({
    type: z.enum(["min_amount", "product", "category", "customer", "first_order"]),
    value: z.string(),
  })).default([]),
});

export type PromotionInput = z.infer<typeof promotionSchema>;

export const couponValidateSchema = z.object({
  code: z.string().min(1),
  tenantId: z.string().min(1),
  subtotal: z.coerce.number().min(0),
  shipping: z.coerce.number().min(0).default(0),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  customerId: z.string().optional(),
  isFirstOrder: z.boolean().default(false),
});

export type CouponValidateInput = z.infer<typeof couponValidateSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/schemas.ts
git commit -m "feat(discounts): add coupon, promotion, and validation schemas"
```

---

### Task 3: DiscountEngine

**Files:**
- Create: `src/lib/services/discounts.ts`

- [ ] **Step 1: Create DiscountEngine with validateCoupon and calculateDiscount**

```ts
import { prisma } from "@/lib/prisma";

interface ValidationContext {
  customerId?: string;
  customerEmail?: string;
  orderSubtotal: number;
  shipping: number;
  productIds: string[];
  categoryIds: string[];
  isFirstOrder: boolean;
}

interface CalculationContext {
  orderSubtotal: number;
  shipping: number;
  productIds: string[];
  categoryIds: string[];
  appliesTo: string;
  productIdsList: string[];
  categoryIdsList: string[];
}

interface ValidationResult {
  valid: boolean;
  coupon?: CouponRecord;
  discount?: DiscountResult;
  error?: string;
}

interface CouponRecord {
  id: string;
  code: string;
  type: string;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  appliesTo: string;
  productIds: string[];
  categoryIds: string[];
  customerIds: string[];
  firstOrderOnly: boolean;
  startsAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  tenantId: string;
}

interface DiscountResult {
  type: "fixed" | "percentage" | "free_shipping";
  amount: number;
  description: string;
  freeShipping: boolean;
}

export async function validateCoupon(
  code: string,
  tenantId: string,
  context: ValidationContext,
): Promise<ValidationResult> {
  const coupon = await prisma.coupon.findUnique({
    where: { code_tenantId: { code: code.toUpperCase(), tenantId } },
  });

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }

  const record: CouponRecord = {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
    minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    maxUses: coupon.maxUses,
    currentUses: coupon.currentUses,
    appliesTo: coupon.appliesTo,
    productIds: coupon.productIds,
    categoryIds: coupon.categoryIds,
    customerIds: coupon.customerIds,
    firstOrderOnly: coupon.firstOrderOnly,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    isActive: coupon.isActive,
    tenantId: coupon.tenantId,
  };

  if (!record.isActive) {
    return { valid: false, error: "Coupon is inactive" };
  }

  const now = new Date();
  if (now < record.startsAt) {
    return { valid: false, error: "Coupon is not yet active" };
  }
  if (record.expiresAt && now > record.expiresAt) {
    return { valid: false, error: "Coupon has expired" };
  }

  if (record.maxUses !== null && record.currentUses >= record.maxUses) {
    return { valid: false, error: "Coupon usage limit reached" };
  }

  if (record.firstOrderOnly && !context.isFirstOrder) {
    return { valid: false, error: "This coupon is for first order only" };
  }

  if (record.appliesTo === "customers") {
    if (!context.customerId || !record.customerIds.includes(context.customerId)) {
      return { valid: false, error: "Coupon not applicable to this customer" };
    }
  }

  if (record.appliesTo === "products") {
    const hasMatch = context.productIds.some((pid) => record.productIds.includes(pid));
    if (!hasMatch) {
      return { valid: false, error: "Coupon not applicable to items in cart" };
    }
  }

  if (record.appliesTo === "categories") {
    const hasMatch = context.categoryIds.some((cid) => record.categoryIds.includes(cid));
    if (!hasMatch) {
      return { valid: false, error: "Coupon not applicable to items in cart" };
    }
  }

  if (record.minOrderAmount !== null && context.orderSubtotal < record.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order amount of $${record.minOrderAmount.toFixed(2)} not met`,
    };
  }

  const discount = calculateDiscount(record, {
    orderSubtotal: context.orderSubtotal,
    shipping: context.shipping,
    productIds: context.productIds,
    categoryIds: context.categoryIds,
    appliesTo: record.appliesTo,
    productIdsList: record.productIds,
    categoryIdsList: record.categoryIds,
  });

  return { valid: true, coupon: record, discount };
}

export function calculateDiscount(
  coupon: CouponRecord,
  context: CalculationContext,
): DiscountResult {
  let applicableSubtotal = context.orderSubtotal;

  if (coupon.appliesTo === "products" && coupon.productIdsList.length > 0) {
    applicableSubtotal = context.orderSubtotal;
  }

  if (coupon.appliesTo === "categories" && coupon.categoryIdsList.length > 0) {
    applicableSubtotal = context.orderSubtotal;
  }

  switch (coupon.type) {
    case "free_shipping":
      return {
        type: "free_shipping",
        amount: 0,
        description: "Free shipping",
        freeShipping: true,
      };

    case "fixed": {
      const amount = Math.min(coupon.value, applicableSubtotal);
      return {
        type: "fixed",
        amount,
        description: `$${amount.toFixed(2)} off`,
        freeShipping: false,
      };
    }

    case "percentage": {
      let amount = applicableSubtotal * (coupon.value / 100);
      if (coupon.maxDiscount !== null) {
        amount = Math.min(amount, coupon.maxDiscount);
      }
      amount = Math.min(amount, applicableSubtotal);
      return {
        type: "percentage",
        amount: Math.round(amount * 100) / 100,
        description: `${coupon.value}% off${coupon.maxDiscount !== null ? ` (max $${coupon.maxDiscount.toFixed(2)})` : ""}`,
        freeShipping: false,
      };
    }

    default:
      return { type: "fixed", amount: 0, description: "", freeShipping: false };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/discounts.ts
git commit -m "feat(discounts): add DiscountEngine with validateCoupon and calculateDiscount"
```

---

### Task 4: CouponUsageService

**Files:**
- Create: `src/lib/services/coupon-usage.ts`

- [ ] **Step 1: Create CouponUsageService for side-effect writes**

```ts
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

interface UsageMeta {
  orderId: string;
  couponId?: string;
  promotionId?: string;
  customerId?: string;
  discountAmount: number;
  discountType: string;
  discountCode?: string;
  tenantId: string;
  userId?: string;
}

export async function recordUsage(meta: UsageMeta): Promise<void> {
  await prisma.promotionUsage.create({
    data: {
      promotionId: meta.promotionId ?? null,
      couponId: meta.couponId ?? null,
      orderId: meta.orderId,
      customerId: meta.customerId ?? null,
      discountAmount: meta.discountAmount,
      discountType: meta.discountType,
      discountCode: meta.discountCode ?? null,
      tenantId: meta.tenantId,
    },
  });

  if (meta.couponId) {
    await prisma.coupon.update({
      where: { id: meta.couponId },
      data: { currentUses: { increment: 1 } },
    });
  }

  await logAudit({
    entityType: "promotion_usage",
    entityId: meta.orderId,
    action: "discount_applied",
    changes: {
      couponId: meta.couponId,
      promotionId: meta.promotionId,
      discountAmount: meta.discountAmount,
      discountType: meta.discountType,
      discountCode: meta.discountCode,
    },
    userId: meta.userId,
    tenantId: meta.tenantId,
  });
}

export async function getUsageStats(
  tenantId: string,
  options?: { couponId?: string; promotionId?: string; from?: Date; to?: Date; page?: number; pageSize?: number },
) {
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { tenantId };
  if (options?.couponId) where.couponId = options.couponId;
  if (options?.promotionId) where.promotionId = options.promotionId;
  if (options?.from || options?.to) {
    const createdAt: Record<string, Date> = {};
    if (options.from) createdAt.gte = options.from;
    if (options.to) createdAt.lte = options.to;
    where.createdAt = createdAt;
  }

  const [items, total] = await Promise.all([
    prisma.promotionUsage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.promotionUsage.count({ where }),
  ]);

  return {
    items: items.map((i) => ({
      ...i,
      discountAmount: Number(i.discountAmount),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAggregateUsageStats(tenantId: string) {
  const usages = await prisma.promotionUsage.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const totalDiscount = usages.reduce((sum, u) => sum + Number(u.discountAmount), 0);
  const totalOrders = new Set(usages.map((u) => u.orderId)).size;
  const byType: Record<string, { count: number; total: number }> = {};

  for (const u of usages) {
    if (!byType[u.discountType]) byType[u.discountType] = { count: 0, total: 0 };
    byType[u.discountType].count++;
    byType[u.discountType].total += Number(u.discountAmount);
  }

  return {
    totalDiscount,
    totalOrders,
    totalUsages: usages.length,
    byType,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/coupon-usage.ts
git commit -m "feat(discounts): add CouponUsageService for recording discount usage"
```

---

### Task 5: Coupon API Routes

**Files:**
- Create: `src/app/api/v1/coupons/route.ts`
- Create: `src/app/api/v1/coupons/validate/route.ts`
- Create: `src/app/api/v1/coupons/[id]/route.ts`
- Create: `src/app/api/v1/coupons/[id]/usage/route.ts`

- [ ] **Step 1: Create API directory structure**

```bash
mkdir -p src/app/api/v1/coupons/validate src/app/api/v1/coupons/\[id\]/usage
```

- [ ] **Step 2: Create coupons list + create route**

```ts
// src/app/api/v1/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { couponSchema } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { tenantId };
    const search = sp.get("search");
    if (search) where.code = { contains: search, mode: "insensitive" };
    const type = sp.get("type");
    if (type) where.type = type;
    const isActive = sp.get("isActive");
    if (isActive !== null) where.isActive = isActive === "true";

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((c) => ({ ...c, value: Number(c.value), maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null, minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = couponSchema.parse(body);

    const existing = await prisma.coupon.findUnique({
      where: { code_tenantId: { code: parsed.code, tenantId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: parsed.code,
        type: parsed.type,
        value: parsed.value,
        maxDiscount: parsed.maxDiscount ?? null,
        minOrderAmount: parsed.minOrderAmount ?? null,
        maxUses: parsed.maxUses ?? null,
        appliesTo: parsed.appliesTo,
        productIds: parsed.productIds,
        categoryIds: parsed.categoryIds,
        customerIds: parsed.customerIds,
        firstOrderOnly: parsed.firstOrderOnly,
        startsAt: new Date(parsed.startsAt),
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        isActive: parsed.isActive,
        tenantId,
      },
    });

    await logAudit({
      entityType: "coupon",
      entityId: coupon.id,
      action: "created",
      changes: parsed,
      userId,
      tenantId,
    });

    return NextResponse.json({ ...coupon, value: Number(coupon.value) }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
```

- [ ] **Step 3: Create coupon validate route**

```ts
// src/app/api/v1/coupons/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/services/discounts";
import { couponValidateSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = couponValidateSchema.parse(body);

    let isFirstOrder = parsed.isFirstOrder;
    if (!isFirstOrder && parsed.customerId) {
      const orderCount = await prisma.order.count({
        where: { customerId: parsed.customerId, tenantId: parsed.tenantId },
      });
      isFirstOrder = orderCount === 0;
    }

    const result = await validateCoupon(parsed.code, parsed.tenantId, {
      customerId: parsed.customerId,
      orderSubtotal: parsed.subtotal,
      shipping: parsed.shipping,
      productIds: parsed.productIds,
      categoryIds: parsed.categoryIds,
      isFirstOrder,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: e.message }, { status: 400 });
  }
}
```

- [ ] **Step 4: Create coupon detail + update + delete route**

```ts
// src/app/api/v1/coupons/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { couponSchema } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...coupon,
      value: Number(coupon.value),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = couponSchema.partial().parse(body);

    const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.code !== undefined) updateData.code = parsed.code;
    if (parsed.type !== undefined) updateData.type = parsed.type;
    if (parsed.value !== undefined) updateData.value = parsed.value;
    if (parsed.maxDiscount !== undefined) updateData.maxDiscount = parsed.maxDiscount ?? null;
    if (parsed.minOrderAmount !== undefined) updateData.minOrderAmount = parsed.minOrderAmount ?? null;
    if (parsed.maxUses !== undefined) updateData.maxUses = parsed.maxUses ?? null;
    if (parsed.appliesTo !== undefined) updateData.appliesTo = parsed.appliesTo;
    if (parsed.productIds !== undefined) updateData.productIds = parsed.productIds;
    if (parsed.categoryIds !== undefined) updateData.categoryIds = parsed.categoryIds;
    if (parsed.customerIds !== undefined) updateData.customerIds = parsed.customerIds;
    if (parsed.firstOrderOnly !== undefined) updateData.firstOrderOnly = parsed.firstOrderOnly;
    if (parsed.startsAt !== undefined) updateData.startsAt = new Date(parsed.startsAt);
    if (parsed.expiresAt !== undefined) updateData.expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive;

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    });

    await logAudit({
      entityType: "coupon",
      entityId: coupon.id,
      action: "updated",
      changes: parsed,
      userId,
      tenantId,
    });

    return NextResponse.json({
      ...coupon,
      value: Number(coupon.value),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAudit({
      entityType: "coupon",
      entityId: coupon.id,
      action: "disabled",
      changes: { isActive: false },
      userId,
      tenantId,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
```

- [ ] **Step 5: Create coupon usage route**

```ts
// src/app/api/v1/coupons/[id]/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";
import { getUsageStats } from "@/lib/services/coupon-usage";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const page = Number(sp.get("page")) || 1;
    const pageSize = Number(sp.get("pageSize")) || 20;

    const result = await getUsageStats(tenantId, {
      couponId: params.id,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/v1/coupons/
git commit -m "feat(discounts): add coupon CRUD and validation API routes"
```

---

### Task 6: Promotion API Routes

**Files:**
- Create: `src/app/api/v1/promotions/route.ts`
- Create: `src/app/api/v1/promotions/[id]/route.ts`

- [ ] **Step 1: Create API directory structure**

```bash
mkdir -p src/app/api/v1/promotions/\[id\]
```

- [ ] **Step 2: Create promotions list + create route**

```ts
// src/app/api/v1/promotions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { promotionSchema } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { tenantId };
    const isActive = sp.get("isActive");
    if (isActive !== null) where.isActive = isActive === "true";

    const [items, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        include: { rules: true, _count: { select: { usages: true } } },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.promotion.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((p) => ({
        ...p,
        discountValue: Number(p.discountValue),
        maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = promotionSchema.parse(body);

    const promotion = await prisma.promotion.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        type: parsed.type,
        priority: parsed.priority,
        discountType: parsed.discountType,
        discountValue: parsed.discountValue,
        maxDiscount: parsed.maxDiscount ?? null,
        startsAt: new Date(parsed.startsAt),
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        isActive: parsed.isActive,
        tenantId,
        rules: {
          create: parsed.rules.map((r) => ({
            type: r.type,
            value: r.value,
            tenantId,
          })),
        },
      },
      include: { rules: true },
    });

    await logAudit({
      entityType: "promotion",
      entityId: promotion.id,
      action: "created",
      changes: parsed,
      userId,
      tenantId,
    });

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
    }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
```

- [ ] **Step 3: Create promotion detail + update + delete route**

```ts
// src/app/api/v1/promotions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { promotionSchema } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: params.id },
      include: { rules: true, _count: { select: { usages: true } } },
    });
    if (!promotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
      maxDiscount: promotion.maxDiscount ? Number(promotion.maxDiscount) : null,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = promotionSchema.partial().parse(body);

    const existing = await prisma.promotion.findUnique({
      where: { id: params.id },
      include: { rules: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description ?? null;
    if (parsed.type !== undefined) updateData.type = parsed.type;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority;
    if (parsed.discountType !== undefined) updateData.discountType = parsed.discountType;
    if (parsed.discountValue !== undefined) updateData.discountValue = parsed.discountValue;
    if (parsed.maxDiscount !== undefined) updateData.maxDiscount = parsed.maxDiscount ?? null;
    if (parsed.startsAt !== undefined) updateData.startsAt = new Date(parsed.startsAt);
    if (parsed.expiresAt !== undefined) updateData.expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive;

    if (parsed.rules !== undefined) {
      await prisma.promotionRule.deleteMany({ where: { promotionId: params.id } });
      await prisma.promotionRule.createMany({
        data: parsed.rules.map((r) => ({
          promotionId: params.id,
          type: r.type,
          value: r.value,
          tenantId,
        })),
      });
    }

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: updateData,
      include: { rules: true },
    });

    await logAudit({
      entityType: "promotion",
      entityId: promotion.id,
      action: "updated",
      changes: parsed,
      userId,
      tenantId,
    });

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAudit({
      entityType: "promotion",
      entityId: promotion.id,
      action: "disabled",
      changes: { isActive: false },
      userId,
      tenantId,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/promotions/
git commit -m "feat(discounts): add promotion CRUD API routes"
```

---

### Task 7: Checkout Integration

**Files:**
- Modify: `src/lib/services/orders.ts`
- Modify: `src/app/api/v1/checkout/route.ts`

- [ ] **Step 1: Add couponCode to CheckoutParams interface in orders.ts**

Find the `CheckoutParams` interface and add the field:

```ts
export interface CheckoutParams {
  customerId: string | null;
  sessionId: string | null;
  tenantId: string;
  addressId?: string;
  address?: Omit<OrderAddressData, "id" | "orderId">;
  notes?: string;
  couponCode?: string; // <-- add this
}
```

- [ ] **Step 2: Add coupon validation before checkout logic in orders.ts**

Find where the order is created in the `checkout` function. After cart items are loaded and before `prisma.order.create`, add:

```ts
import { validateCoupon, calculateDiscount } from "@/lib/services/discounts";
import { recordUsage } from "@/lib/services/coupon-usage";
```

Then in the checkout function, after loading cart items:

```ts
  let discountAmount = 0;
  let discountType: string | null = null;
  let discountCode: string | null = null;
  let couponId: string | null = null;
  let freeShipping = false;

  if (params.couponCode) {
    const productIds = items.map((i) => i.variant?.productId).filter(Boolean) as string[];
    const categoryIds: string[] = [];

    const validationResult = await validateCoupon(params.couponCode, params.tenantId, {
      customerId: params.customerId ?? undefined,
      orderSubtotal: subtotal,
      shipping,
      productIds,
      categoryIds,
      isFirstOrder: false,
    });

    if (!validationResult.valid) {
      throw new Error(validationResult.error || "Invalid coupon code");
    }

    const discount = calculateDiscount(validationResult.coupon!, {
      orderSubtotal: subtotal,
      shipping,
      productIds,
      categoryIds,
      appliesTo: validationResult.coupon!.appliesTo,
      productIdsList: validationResult.coupon!.productIds,
      categoryIdsList: validationResult.coupon!.categoryIds,
    });

    discountAmount = discount.amount;
    discountType = discount.type;
    discountCode = validationResult.coupon!.code;
    couponId = validationResult.coupon!.id;
    freeShipping = discount.freeShipping;
  }

  const shippingCost = freeShipping ? 0 : shipping;
  const total = subtotal + shippingCost + tax - discountAmount;
```

Then in the `prisma.order.create` call, include:

```ts
discountAmount,
discountCode,
discountType,
```

And use `shippingCost` instead of plain `shipping`.

After successful order creation, record usage:

```ts
  if (couponId) {
    await recordUsage({
      orderId: order.id,
      couponId,
      customerId: params.customerId ?? undefined,
      discountAmount,
      discountType: discountType!,
      discountCode: discountCode!,
      tenantId: params.tenantId,
    });
  }
```

- [ ] **Step 3: Update checkout route to accept couponCode**

```ts
// In the POST handler, add couponCode to destructuring
const { tenantId, addressId, address: inlineAddress, notes, couponCode } = body;

// In the checkout call, add couponCode
const result = await checkout({
  customerId,
  sessionId,
  tenantId,
  addressId: parsed.data.addressId,
  address,
  notes: parsed.data.notes,
  couponCode,
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/services/orders.ts src/app/api/v1/checkout/route.ts
git commit -m "feat(checkout): integrate coupon validation and discount application"
```

---

### Task 8: Dashboard Pages

**Files:**
- Create: `src/app/(dashboard)/merchant/promotions/page.tsx`
- Create: `src/app/(dashboard)/merchant/promotions/coupons/new/page.tsx`
- Create: `src/app/(dashboard)/merchant/promotions/coupons/[id]/page.tsx`
- Create: `src/app/(dashboard)/merchant/promotions/promotions/new/page.tsx`
- Create: `src/app/(dashboard)/merchant/promotions/promotions/[id]/page.tsx`
- Create: `src/components/cc/views/PromotionsView.tsx`
- Create: `src/components/cc/views/CouponFormView.tsx`
- Create: `src/components/cc/views/CouponDetailView.tsx`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p src/app/\(dashboard\)/merchant/promotions/coupons/new
mkdir -p src/app/\(dashboard\)/merchant/promotions/coupons/\[id\]
mkdir -p src/app/\(dashboard\)/merchant/promotions/coupons/\[id\]/edit
mkdir -p src/app/\(dashboard\)/merchant/promotions/promotions/new
mkdir -p src/app/\(dashboard\)/merchant/promotions/promotions/\[id\]
mkdir -p src/app/\(dashboard\)/merchant/promotions/promotions/\[id\]/edit
```

- [ ] **Step 2: Create dashboard page wrappers**

```tsx
// src/app/(dashboard)/merchant/promotions/page.tsx
"use client";
import PromotionsView from "@/components/cc/views/PromotionsView";
export default function Page() { return <PromotionsView />; }

// src/app/(dashboard)/merchant/promotions/coupons/new/page.tsx
"use client";
import CouponFormView from "@/components/cc/views/CouponFormView";
export default function Page() { return <CouponFormView />; }

// src/app/(dashboard)/merchant/promotions/coupons/[id]/page.tsx
"use client";
import CouponDetailView from "@/components/cc/views/CouponDetailView";
export default function Page() { return <CouponDetailView />; }

// src/app/(dashboard)/merchant/promotions/coupons/[id]/edit/page.tsx
"use client";
import CouponFormView from "@/components/cc/views/CouponFormView";
import { useParams } from "next/navigation";
export default function Page() {
  const params = useParams();
  return <CouponFormView id={params.id as string} />;
}

// src/app/(dashboard)/merchant/promotions/promotions/new/page.tsx
"use client";
import CouponFormView from "@/components/cc/views/CouponFormView";
export default function Page() { return <CouponFormView mode="promotion" />; }

// src/app/(dashboard)/merchant/promotions/promotions/[id]/page.tsx
"use client";
import CouponDetailView from "@/components/cc/views/CouponDetailView";
export default function Page() { return <CouponDetailView mode="promotion" />; }

// src/app/(dashboard)/merchant/promotions/promotions/[id]/edit/page.tsx
"use client";
import CouponFormView from "@/components/cc/views/CouponFormView";
import { useParams } from "next/navigation";
export default function Page() {
  const params = useParams();
  return <CouponFormView mode="promotion" id={params.id as string} />;
}
```

- [ ] **Step 3: Create PromotionsView (list + tabs)**

```tsx
// src/components/cc/views/PromotionsView.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Tag, Percent, Truck, MoreHorizontal } from "lucide-react";

const TABS = ["Coupons", "Promotions", "Usage Analytics"] as const;

interface CouponItem {
  id: string; code: string; type: string; value: number; currentUses: number;
  maxUses: number | null; isActive: boolean; expiresAt: string | null;
}

interface PromotionItem {
  id: string; name: string; type: string; discountType: string;
  discountValue: number; isActive: boolean; expiresAt: string | null;
  _count: { usages: number };
}

interface UsageStats {
  totalDiscount: number; totalOrders: number; totalUsages: number; byType: Record<string, { count: number; total: number }>;
}

export default function PromotionsView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Coupons");
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    const res = await fetch(`/api/v1/coupons?search=${search}&pageSize=100`);
    if (res.ok) { const data = await res.json(); setCoupons(data.items); }
  }, [search]);

  const fetchPromotions = useCallback(async () => {
    const res = await fetch("/api/v1/promotions?pageSize=100");
    if (res.ok) { const data = await res.json(); setPromotions(data.items); }
  }, []);

  const fetchUsage = useCallback(async () => {
    const res = await fetch("/api/v1/coupons?pageSize=1");
    if (res.ok) {
      setUsageStats({ totalDiscount: 0, totalOrders: 0, totalUsages: 0, byType: {} });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCoupons(), fetchPromotions(), fetchUsage()]).finally(() => setLoading(false));
  }, [fetchCoupons, fetchPromotions, fetchUsage]);

  const typeIcon = (type: string) => {
    switch (type) {
      case "fixed": return <Tag size={14} className="text-blue-500" />;
      case "percentage": return <Percent size={14} className="text-green-500" />;
      case "free_shipping": return <Truck size={14} className="text-purple-500" />;
      default: return null;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "fixed": return "Fixed";
      case "percentage": return "Percentage";
      case "free_shipping": return "Free Shipping";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <div className="flex gap-2">
          {activeTab === "Coupons" && (
            <button
              onClick={() => router.push("/merchant/promotions/coupons/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <Plus size={16} /> New Coupon
            </button>
          )}
          {activeTab === "Promotions" && (
            <button
              onClick={() => router.push("/merchant/promotions/promotions/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <Plus size={16} /> New Promotion
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Coupons" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm"
            />
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Value</th>
                  <th className="text-left px-4 py-3 font-medium">Uses</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Expires</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No coupons yet</td></tr>
                ) : coupons.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/merchant/promotions/coupons/${c.id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        {typeIcon(c.type)} {typeLabel(c.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.type === "percentage" ? `${c.value}%` : `$${c.value.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3">
                      {c.currentUses}{c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {c.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-muted rounded">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Promotions" && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Discount</th>
                <th className="text-left px-4 py-3 font-medium">Uses</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No promotions yet</td></tr>
              ) : promotions.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/merchant/promotions/promotions/${p.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 capitalize">{p.type.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {typeIcon(p.discountType)} {p.discountType === "percentage" ? `${p.discountValue}%` : `$${Number(p.discountValue).toFixed(2)}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p._count.usages}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "Usage Analytics" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Discount Given</p>
            <p className="text-2xl font-bold">${usageStats?.totalDiscount.toFixed(2) ?? "0.00"}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Orders with Discounts</p>
            <p className="text-2xl font-bold">{usageStats?.totalOrders ?? 0}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Usages</p>
            <p className="text-2xl font-bold">{usageStats?.totalUsages ?? 0}</p>
          </div>
          {usageStats?.byType && Object.entries(usageStats.byType).map(([type, data]) => (
            <div key={type} className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground capitalize">{type.replace("_", " ")}</p>
              <p className="text-2xl font-bold">{data.count} uses</p>
              <p className="text-sm text-muted-foreground">${data.total.toFixed(2)} total</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create CouponFormView**

```tsx
// src/components/cc/views/CouponFormView.tsx
"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  mode?: "coupon" | "promotion";
  id?: string; // if provided, loads existing item for editing
}

export default function CouponFormView({ mode = "coupon", id }: Props) {
  const router = useRouter();
  const isPromotion = mode === "promotion";
  const isEditing = !!id;

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    type: "fixed",
    value: "",
    maxDiscount: "",
    minOrderAmount: "",
    maxUses: "",
    appliesTo: "all",
    firstOrderOnly: false,
    isActive: true,
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: "",
    productIds: "",
    categoryIds: "",
    customerIds: "",
    discountType: "fixed",
    discountValue: "",
    priority: "0",
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing data for edit mode
  useEffect(() => {
    if (!id) return;
    const endpoint = isPromotion ? `/api/v1/promotions/${id}` : `/api/v1/coupons/${id}`;
    fetch(endpoint).then((res) => res.ok && res.json()).then((data) => {
      if (isPromotion) {
        setForm({
          ...form,
          name: data.name || "",
          description: data.description || "",
          discountType: data.discountType || "fixed",
          discountValue: String(data.discountValue || ""),
          maxDiscount: data.maxDiscount ? String(data.maxDiscount) : "",
          priority: String(data.priority || "0"),
          isActive: data.isActive,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString().slice(0, 16) : form.startsAt,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : "",
        });
      } else {
        setForm({
          ...form,
          code: data.code || "",
          type: data.type || "fixed",
          value: String(data.value || ""),
          maxDiscount: data.maxDiscount ? String(data.maxDiscount) : "",
          minOrderAmount: data.minOrderAmount ? String(data.minOrderAmount) : "",
          maxUses: data.maxUses ? String(data.maxUses) : "",
          appliesTo: data.appliesTo || "all",
          productIds: (data.productIds || []).join(", "),
          categoryIds: (data.categoryIds || []).join(", "),
          customerIds: (data.customerIds || []).join(", "),
          firstOrderOnly: data.firstOrderOnly || false,
          isActive: data.isActive,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString().slice(0, 16) : form.startsAt,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : "",
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = isEditing
        ? (isPromotion ? `/api/v1/promotions/${id}` : `/api/v1/coupons/${id}`)
        : (isPromotion ? "/api/v1/promotions" : "/api/v1/coupons");
      const method = isEditing ? "PATCH" : "POST";
      const body = isPromotion ? {
        name: form.name,
        description: form.description || undefined,
        type: "automatic",
        priority: parseInt(form.priority) || 0,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: form.isActive,
        rules: [],
      } : {
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        appliesTo: form.appliesTo,
        productIds: form.productIds ? form.productIds.split(",").map(s => s.trim()).filter(Boolean) : [],
        categoryIds: form.categoryIds ? form.categoryIds.split(",").map(s => s.trim()).filter(Boolean) : [],
        customerIds: form.customerIds ? form.customerIds.split(",").map(s => s.trim()).filter(Boolean) : [],
        firstOrderOnly: form.firstOrderOnly,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: form.isActive,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }

      router.push("/merchant/promotions");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 max-w-2xl"><div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" /><div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div></div>;
  }

  if (isPromotion) {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">New Promotion</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Value</label>
              <input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Discount (optional)</label>
            <input type="number" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires (optional)</label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Saving..." : isEditing ? "Update Promotion" : "Create Promotion"}
            </button>
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? "Edit Coupon" : "New Coupon"}</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Coupon Code</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. SAVE20"
            required
            className="w-full px-3 py-2 border rounded-md text-sm font-mono uppercase"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Discount Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm">
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        </div>
        {form.type === "percentage" && (
          <div>
            <label className="block text-sm font-medium mb-1">Max Discount (cap)</label>
            <input type="number" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Minimum Order Amount</label>
          <input type="number" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Uses</label>
          <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Applies To</label>
          <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm">
            <option value="all">All Items</option>
            <option value="products">Specific Products</option>
            <option value="categories">Specific Categories</option>
            <option value="customers">Specific Customers</option>
          </select>
        </div>
        {form.appliesTo === "products" && (
          <div>
            <label className="block text-sm font-medium mb-1">Product IDs (comma-separated)</label>
            <input type="text" value={form.productIds} onChange={(e) => setForm({ ...form, productIds: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        )}
        {form.appliesTo === "categories" && (
          <div>
            <label className="block text-sm font-medium mb-1">Category IDs (comma-separated)</label>
            <input type="text" value={form.categoryIds} onChange={(e) => setForm({ ...form, categoryIds: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        )}
        {form.appliesTo === "customers" && (
          <div>
            <label className="block text-sm font-medium mb-1">Customer IDs (comma-separated)</label>
            <input type="text" value={form.customerIds} onChange={(e) => setForm({ ...form, customerIds: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="firstOrderOnly" checked={form.firstOrderOnly} onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })} />
          <label htmlFor="firstOrderOnly" className="text-sm">First order only</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expires (optional)</label>
            <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <label htmlFor="isActive" className="text-sm">Active</label>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Saving..." : isEditing ? "Update Coupon" : "Create Coupon"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create CouponDetailView**

```tsx
// src/components/cc/views/CouponDetailView.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Props {
  mode?: "coupon" | "promotion";
}

interface UsageRecord {
  id: string; orderId: string; discountAmount: number; discountType: string;
  discountCode: string | null; customerId: string | null; createdAt: string;
}

export default function CouponDetailView({ mode = "coupon" }: Props) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isPromotion = mode === "promotion";

  const [item, setItem] = useState<any>(null);
  const [usages, setUsages] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchItem = async () => {
    const endpoint = isPromotion ? `/api/v1/promotions/${id}` : `/api/v1/coupons/${id}`;
    const res = await fetch(endpoint);
    if (!res.ok) { setError("Not found"); setLoading(false); return; }
    const data = await res.json();
    setItem(data);
  };

  const fetchUsage = async () => {
    if (isPromotion) return;
    const res = await fetch(`/api/v1/coupons/${id}/usage?pageSize=50`);
    if (res.ok) { const data = await res.json(); setUsages(data.items); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchItem(), fetchUsage()]).finally(() => setLoading(false));
  }, [id]);

  const toggleActive = async () => {
    const endpoint = isPromotion ? `/api/v1/promotions/${id}` : `/api/v1/coupons/${id}`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) setItem({ ...item, isActive: !item.isActive });
  };

  if (loading) return <div className="p-6 space-y-4"><div className="h-8 w-64 bg-muted animate-pulse rounded" /><div className="h-32 bg-muted animate-pulse rounded" /></div>;
  if (error) return <div className="p-6"><p className="text-red-500">{error}</p></div>;
  if (!item) return null;

  const typeLabel = (t: string) => {
    switch (t) { case "fixed": return "Fixed Amount"; case "percentage": return "Percentage"; case "free_shipping": return "Free Shipping"; default: return t; }
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/merchant/promotions")} className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
            &larr; Back to Promotions
          </button>
          <h1 className="text-2xl font-bold">
            {isPromotion ? item.name : item.code}
          </h1>
          <p className="text-sm text-muted-foreground">{typeLabel(isPromotion ? item.discountType : item.type)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleActive}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
              item.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"
            }`}
          >
            {item.isActive ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => router.push(isPromotion ? `/merchant/promotions/promotions/${id}/edit` : `/merchant/promotions/coupons/${id}/edit`)}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isPromotion ? (
          <>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Discount</p>
              <p className="text-lg font-semibold">{item.discountType === "percentage" ? `${item.discountValue}%` : `$${Number(item.discountValue).toFixed(2)}`}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Max Discount</p>
              <p className="text-lg font-semibold">{item.maxDiscount ? `$${Number(item.maxDiscount).toFixed(2)}` : "None"}</p>
            </div>
          </>
        ) : (
          <>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Value</p>
              <p className="text-lg font-semibold">{item.type === "percentage" ? `${item.value}%` : `$${Number(item.value).toFixed(2)}`}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Usage</p>
              <p className="text-lg font-semibold">{item.currentUses}{item.maxUses ? ` / ${item.maxUses}` : ""}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Min Order</p>
              <p className="text-lg font-semibold">{item.minOrderAmount ? `$${Number(item.minOrderAmount).toFixed(2)}` : "None"}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Applies To</p>
              <p className="text-lg font-semibold capitalize">{item.appliesTo}</p>
            </div>
          </>
        )}
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-lg font-semibold">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {item.isActive ? "Active" : "Disabled"}
            </span>
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Expires</p>
          <p className="text-lg font-semibold">{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "Never"}</p>
        </div>
      </div>

      {!isPromotion && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Usage History</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium">Order</th>
                  <th className="text-left px-4 py-3 font-medium">Discount</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {usages.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No usage yet</td></tr>
                ) : usages.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{u.orderId.slice(0, 8)}...</td>
                    <td className="px-4 py-3">${Number(u.discountAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 capitalize">{u.discountType.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/merchant/promotions/ src/components/cc/views/PromotionsView.tsx src/components/cc/views/CouponFormView.tsx src/components/cc/views/CouponDetailView.tsx
git commit -m "feat(ui): add promotions dashboard pages with list, form, detail views"
```

---

### Task 9: Typecheck + Lint Verification

**Files:** (none — verification only)

- [ ] **Step 1: Run typecheck**

```bash
bun run typecheck
```

Expected: No new errors (pre-existing errors in `InventoryService.ts`, `redis.ts`, orders page are acceptable baseline).

- [ ] **Step 2: Run lint**

```bash
bun run lint
```

Expected: No new errors in our files.

- [ ] **Step 3: Fix any issues found**

If typecheck or lint errors exist in our new files, fix them.

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "chore: fix typecheck/lint issues from discount engine"
```
