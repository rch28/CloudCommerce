# Discount Engine — Design Spec

> Phase 5 Sprint 1 — Production-grade discount engine with coupons and promotions.

## Problem

CloudCommerce needs a discount engine that supports coupon codes, rule-based promotions, validation against order context, and audit trail — all integrated into the existing multi-tenant ecommerce platform.

## Architecture

**Pure engine + side-effect helpers** pattern:

```
DiscountEngine (stateless)          CouponUsageService       API Routes
┌──────────────────────┐           ┌────────────────────┐  ┌────────────────┐
│ validateCoupon()     │           │ recordUsage()      │  │ Call engine    │
│ calculateDiscount()  │           │ incrementUses()    │  │ + usage helper │
│                      │           │ writeAuditLog()    │  │ Return JSON    │
│ Pure logic + DB reads│           │ All DB writes      │  │                │
│ No writes, no audit  │           │                    │  │                │
└──────────────────────┘           └────────────────────┘  └────────────────┘
```

## Models

### Coupon

```
model Coupon {
  id              String   @id @default(cuid())
  code            String   // uppercased, stored as-is
  type            String   // fixed | percentage | free_shipping
  value           Decimal  // amount or percentage value
  maxDiscount     Decimal? // cap for percentage discounts
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

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([code, tenantId])
  @@index([tenantId])
}
```

### Promotion

```
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

  tenant Tenant          @relation(fields: [tenantId], references: [id])
  rules  PromotionRule[]
  usages PromotionUsage[]

  @@index([tenantId])
}
```

### PromotionRule

```
model PromotionRule {
  id          String @id @default(cuid())
  promotionId String
  type        String // min_amount | product | category | customer | first_order
  value       String // JSON config: { amount: 5000, productIds: [...], etc }
  tenantId    String

  promotion Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)

  @@index([promotionId])
}
```

### PromotionUsage

```
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

  createdAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([promotionId])
  @@index([couponId])
  @@index([orderId])
  @@index([tenantId])
}
```

### Order additions

```
// Add to existing Order model:
discountAmount Decimal   @default(0)
discountCode   String?
discountType   String?
```

## DiscountEngine (`src/lib/services/discounts.ts`)

### `validateCoupon(code, tenantId, context)`

```ts
interface ValidationContext {
  customerId?: string;
  customerEmail?: string;
  orderSubtotal: number;
  productIds: string[];
  categoryIds: string[];
  isFirstOrder: boolean;
}

interface ValidationResult {
  valid: boolean;
  coupon?: CouponRecord;
  discount?: DiscountResult;
  error?: string;
}
```

Steps:
1. Look up coupon by `code` + `tenantId` from DB
2. If not found → `{ valid: false, error: "Invalid coupon code" }`
3. If not active or expired → `{ valid: false, error: "Coupon expired or inactive" }`
4. If `maxUses` reached → `{ valid: false, error: "Coupon usage limit reached" }`
5. If `firstOrderOnly` and not first order → `{ valid: false, error: "First order only" }`
6. If `appliesTo === "customers"` and customer not in `customerIds` → restricted
7. If `appliesTo === "products"` and no overlap between cart productIds and coupon productIds → no matching products
8. If `appliesTo === "categories"` and no overlap between cart categoryIds and coupon categoryIds → no matching categories
9. If `orderSubtotal < minOrderAmount` → `{ valid: false, error: "Minimum order amount not met" }`
10. All checks pass → calculate discount and return

### `calculateDiscount(coupon, context)`

```ts
interface CalculationContext {
  orderSubtotal: number;
  shipping: number;
  productIds: string[];
  categoryIds: string[];
}

interface DiscountResult {
  type: "fixed" | "percentage" | "free_shipping";
  amount: number;       // computed discount value
  description: string;
  freeShipping: boolean;
}
```

Steps:
1. `fixed`: amount = `min(value, maxDiscount ?? value)`, capped at subtotal
2. `percentage`: amount = `subtotal * value / 100`, capped at `maxDiscount` if set, capped at subtotal
3. `free_shipping`: amount = 0 (shipping is zeroed separately), freeShipping = true
4. If `appliesTo` is `products` or `categories`, filter matching items, compute weighted subtotal of matching items, apply percentage/fixed to that subtotal
5. Always cap `amount` at `orderSubtotal`

## CouponUsageService (`src/lib/services/coupon-usage.ts`)

Handles all DB writes related to discount usage — called by API routes and checkout flow after the engine returns a valid result.

```ts
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

function recordUsage(meta: UsageMeta): Promise<void>
  // Creates PromotionUsage row, increments coupon.currentUses, writes audit log
```

## Zod Schemas (`src/lib/schemas.ts`)

```ts
const couponSchema = z.object({
  code: z.string().min(1).max(50).transform(v => v.toUpperCase()),
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
  startsAt: z.string().datetime().or(z.date()),
  expiresAt: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().default(true),
});

const promotionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["automatic", "cart_rule"]).default("automatic"),
  priority: z.coerce.number().int().default(0),
  discountType: z.enum(["fixed", "percentage", "free_shipping"]),
  discountValue: z.coerce.number().positive(),
  maxDiscount: z.coerce.number().positive().optional(),
  startsAt: z.string().datetime().or(z.date()),
  expiresAt: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().default(true),
  rules: z.array(z.object({
    type: z.enum(["min_amount", "product", "category", "customer", "first_order"]),
    value: z.string(), // JSON string
  })).default([]),
});
```

## API Routes

### `POST /api/v1/coupons/validate`
- Body: `{ code, tenantId, subtotal, productIds, categoryIds, customerId?, isFirstOrder? }`
- Calls `DiscountEngine.validateCoupon()`
- Returns `{ valid, discount?, error? }` — no side effects

### `GET /api/v1/coupons`
- List coupons for tenant, paginated
- Filters: `search` (on code), `type`, `isActive`
- Returns `{ items, total, page, pageSize }`

### `POST /api/v1/coupons`
- Body: `couponSchema`
- Creates coupon + audit log
- Returns created coupon

### `GET /api/v1/coupons/:id`
- Single coupon detail + usage stats

### `PATCH /api/v1/coupons/:id`
- Update coupon fields + audit log

### `DELETE /api/v1/coupons/:id`
- Soft-disable (set isActive = false) + audit log

### `GET /api/v1/coupons/:id/usage`
- Paginated usage history for this coupon

### `GET /api/v1/promotions`
- List promotions for tenant

### `POST /api/v1/promotions`
- Create promotion with rules + audit log

### `PATCH /api/v1/promotions/:id`
- Update promotion + rules + audit log

### `DELETE /api/v1/promotions/:id`
- Soft-disable + audit log

## Checkout Integration

### Checkout flow with coupon:

```
POST /api/v1/checkout { ..., couponCode }
```

1. Parse request body
2. Load cart items from DB
3. If `couponCode` present:
   a. Call `validateCoupon(code, tenantId, context)` — returns `{ valid, discount }` or throws
   b. If valid, apply discount to order total
4. Continue normal checkout (inventory, payment, etc.)
5. After order creation:
   a. Record `PromotionUsage` row
   b. Increment `coupon.currentUses`
   c. Write audit log

### Order total calculation:

```
subtotal = sum(cart items)
shipping = calculated (or 0 if free_shipping coupon applied)
discount = amount from calculateDiscount()
total = subtotal + shipping + tax - discount
```

## Dashboard Pages

### `/merchant/promotions` (view: `PromotionsView`)
- Tabs: "Coupons" | "Promotions" | "Usage Analytics"
- Coupon tab: searchable table with code, type, value, uses, status
- Promotions tab: table with name, type, status, dates
- Usage Analytics tab: charts showing discount usage over time, top coupons

### `/merchant/promotions/coupons/new` (view: `CouponFormView`)
- Form: code (auto-uppercase), type selector (fixed/percent/free_shipping), value
- Conditional fields based on type: maxDiscount, minOrderAmount, maxUses
- Applies to: all/products/categories/customers (with multi-select)
- First order only toggle
- Date range: startsAt, expiresAt

### `/merchant/promotions/coupons/:id` (view: `CouponDetailView`)
- Read coupon details
- Usage history table
- Edit button → edit form
- Disable/enable toggle

### `/merchant/promotions/promotions/new` + `/merchant/promotions/promotions/:id`
- Similar to coupons but with rule builder UI

## File Plan

```
CREATE:
  prisma/migrations/20260619_discount_engine/migration.sql

  src/lib/services/discounts.ts            # DiscountEngine (pure)
  src/lib/services/coupon-usage.ts         # Coupon usage side effects

  src/app/api/v1/coupons/route.ts          # GET + POST
  src/app/api/v1/coupons/validate/route.ts # POST validate
  src/app/api/v1/coupons/[id]/route.ts     # GET + PATCH + DELETE
  src/app/api/v1/coupons/[id]/usage/route.ts  # GET usage
  src/app/api/v1/promotions/route.ts       # GET + POST
  src/app/api/v1/promotions/[id]/route.ts  # GET + PATCH + DELETE

  src/app/(dashboard)/merchant/promotions/page.tsx
  src/app/(dashboard)/merchant/promotions/coupons/new/page.tsx
  src/app/(dashboard)/merchant/promotions/coupons/[id]/page.tsx
  src/app/(dashboard)/merchant/promotions/promotions/new/page.tsx
  src/app/(dashboard)/merchant/promotions/promotions/[id]/page.tsx

  src/components/cc/views/PromotionsView.tsx
  src/components/cc/views/CouponFormView.tsx
  src/components/cc/views/CouponDetailView.tsx

MODIFY:
  prisma/schema.prisma                      # 4 new models + Order additions
  src/lib/schemas.ts                         # couponSchema, promotionSchema
  src/lib/services/orders.ts                 # coupon validation in checkout
  src/app/api/v1/checkout/route.ts           # couponCode field
```

## Error Handling

| Error | HTTP | Behavior |
|-------|------|----------|
| Invalid code | 400 | `{ error: "Invalid coupon code" }` |
| Expired | 400 | `{ error: "Coupon has expired" }` |
| Max uses | 400 | `{ error: "Usage limit reached" }` |
| Min order | 400 | `{ error: "Minimum order $X not met" }` |
| First order | 400 | `{ error: "First order only" }` |
| Not applicable | 400 | `{ error: "Coupon not applicable to these items" }` |

## Implementation Order

1. Prisma schema + migration
2. Zod schemas
3. DiscountEngine service
4. Coupon usage service
5. API routes (coupons validate, CRUD, promotions)
6. Checkout integration
7. Dashboard pages + view components
8. Audit logging integration
9. Typecheck + lint verification
