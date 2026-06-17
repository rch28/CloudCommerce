# Sprint 5 — Payments & SaaS Subscriptions

## Goal
Production-grade multi-tenant billing layer: plans, subscriptions, payment provider abstraction, webhook processing with retry queue, feature gating, and a merchant-facing billing dashboard.

## Models (Prisma)

### Plan
- `id`, `name` (unique), `slug` (unique), `price` (Decimal), `features` (String[]), `maxProducts` (Int?), `maxStaff` (Int?), timestamps
- Relation: `subscriptions Subscription[]`

### Subscription
- `id`, `tenantId`, `planId`, `status` (active|trialing|past_due|canceled|expired), `currentPeriodStart`, `currentPeriodEnd`, `canceledAt?`, `trialEndsAt?`, timestamps
- Relations: `tenant Tenant`, `plan Plan`, `payments Payment[]`
- Unique on `tenantId` (one active subscription per tenant)

### Payment
- `id`, `subscriptionId?`, `tenantId`, `amount`, `currency`, `status` (succeeded|failed|pending|refunded), `provider`, `providerPaymentId?`, `invoiceUrl?`, `description?`, timestamps
- Relations: `subscription Subscription?`, `tenant Tenant`

### WebhookEvent
- `id`, `provider`, `eventType`, `rawBody`, `status` (pending|processed|failed|retrying), `attempts`, `maxAttempts`, `nextRetryAt?`, `processedAt?`, `error?`, timestamps
- Relation: `logs WebhookLog[]`

### WebhookLog
- `id`, `webhookId`, `level` (info|warn|error), `message`, timestamp
- Relation: `webhook WebhookEvent` (cascade delete)

## Architecture

### Payment Provider Layer (`src/lib/payments/`)
- **`provider.ts`** — `PaymentProvider` interface (createPayment, verifyPayment, refundPayment)
- **`stripe.ts`** — StripeProvider (live API stubs)
- **`khalti.ts`** — KhaltiProvider (mock stubs)
- **`esewa.ts`** — eSewaProvider (mock stubs)
- **`index.ts`** — `getProvider(name)` factory

### Subscription Service (`src/lib/services/subscriptions.ts`)
- `subscribe(tenantId, planId, trialDays?)` → creates subscription
- `upgrade(tenantId, newPlanId)` → prorated plan change
- `downgrade(tenantId, newPlanId)` → immediate or end-of-period
- `cancel(tenantId)` → soft cancel with `canceledAt`
- All operations log to AuditLog

### Webhook System (`src/lib/webhooks/`)
- **`handler.ts`** — dispatches by provider + event type
- **`queue.ts`** — in-memory retry queue, exponential backoff, max 5 attempts
- Routes: `/api/webhooks/stripe`, `/api/webhooks/khalti`, `/api/webhooks/esewa`

### Feature Gating (`src/lib/features.ts`)
- Static map: planSlug → feature key list
- `hasFeature(planSlug, feature)` — identity check
- `getFeatures(planSlug)` — return feature list for UI
- Enterprise gets `'*'` wildcard

### Seed Data
- Starter ($29/mo): 100 products, basic analytics, email support
- Growth ($79/mo): 1,000 products, advanced analytics, custom domain, real-time sync
- Enterprise ($199/mo): unlimited products, all features, priority support, API access

### Billing Dashboard (`/merchant/billing`)
- Current plan card with usage
- Invoice history table
- Upgrade/downgrade buttons
- Component at `components/cc/views/BillingView.tsx`

### API Routes
- `GET /api/v1/plans` — list plans
- `GET/PUT /api/v1/subscriptions` — get/update subscription
- `POST /api/v1/subscriptions/cancel` — cancel
- `GET /api/v1/payments` — invoice history
- `POST /api/v1/webhooks/stripe|khalti|esewa` — webhook receivers

### Audit
- Extend `EntityType`: `"subscription" | "payment"`
- Extend `Action`: `"subscribed" | "upgraded" | "downgraded" | "canceled" | "payment_received" | "payment_refunded"`

## Files Created
- `prisma/schema.prisma` — add 5 models
- `src/lib/payments/provider.ts`
- `src/lib/payments/stripe.ts`
- `src/lib/payments/khalti.ts`
- `src/lib/payments/esewa.ts`
- `src/lib/payments/index.ts`
- `src/lib/services/subscriptions.ts`
- `src/lib/webhooks/handler.ts`
- `src/lib/webhooks/queue.ts`
- `src/lib/features.ts`
- `src/lib/audit.ts` — extend types
- `src/lib/schemas.ts` — add plan/subscription/payment schemas
- `src/data/seed.ts` — plan seeds
- `src/app/api/v1/plans/route.ts`
- `src/app/api/v1/subscriptions/route.ts`
- `src/app/api/v1/payments/route.ts`
- `src/app/api/v1/webhooks/stripe/route.ts`
- `src/app/api/v1/webhooks/khalti/route.ts`
- `src/app/api/v1/webhooks/esewa/route.ts`
- `src/app/(dashboard)/merchant/billing/page.tsx`
- `src/components/cc/views/BillingView.tsx`
