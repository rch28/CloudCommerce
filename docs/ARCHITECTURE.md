# CloudCommerce Architecture

## Overview

CloudCommerce is a multi-tenant e-commerce platform built with Next.js 16 (App Router), Prisma 7, and PostgreSQL. It provides storefront, dashboard, catalog management, and billing for merchants.

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Framework   | Next.js 16 (App Router, Turbopack)     |
| Language    | TypeScript 6                           |
| Database    | PostgreSQL via Prisma 7                |
| Auth        | Clerk (multi-tenant)                   |
| State       | React Context + TanStack Query         |
| Styling     | Tailwind CSS 4                         |
| Charts      | Recharts 3                             |
| Validation  | Zod 4                                  |
| Forms       | React Hook Form 7                      |
| Payments    | Stripe / Khalti / eSewa (provider pattern) |
| Testing     | Vitest (unit), Playwright (E2E)        |
| CI/CD       | GitHub Actions                         |
| Container   | Docker + docker-compose                |

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Merchant & Admin dashboard
│   ├── (storefront)/       # Customer storefront
│   └── api/v1/             # REST API routes
├── components/
│   ├── cc/views/           # Page-level view components
│   ├── dashboard/          # Dashboard UI components
│   │   ├── admin/          # Admin dashboard
│   │   ├── charts/         # Recharts wrappers
│   │   ├── merchant/       # Merchant dashboard
│   │   └── widgets/        # Polling metric widgets
│   ├── storefront/         # Customer-facing components
│   └── ui/                 # shadcn/ui primitives
├── contexts/               # React context providers
├── data/                   # Mock data (fallback)
├── lib/
│   ├── payments/           # Payment provider implementations
│   ├── security/           # Rate limiting, CSRF
│   ├── services/           # Business logic
│   ├── upload/             # File upload providers
│   └── webhooks/           # Webhook processing + retry queue
└── middleware.ts           # CSP, rate limiting, request logging
```

## Architecture Decisions

### Multi-Tenancy
- Subdomain-based tenant routing
- Foreign key scoping via `tenantId` on all data models
- Middleware extracts `x-tenant-id` from request

### Data Access Pattern
- Services auto-detect `DATABASE_URL`: Prisma when set, mock arrays otherwise
- Lazy PrismaClient initialization via proxy pattern
- Pagination helper for consistent list endpoints

### Payment Provider Pattern
- Interface: `PaymentProvider` with `createPayment`, `verifyPayment`, `refundPayment`
- Implementations: Stripe, Khalti, eSewa
- Factory: `getProvider(name)` for runtime selection

### Feature Gating
- Plan-based feature maps (Starter / Growth / Enterprise)
- Runtime `hasFeature(planSlug, feature)` checks
- Cache-friendly static configuration

### Caching Strategy
- In-memory analytics cache with configurable TTL (default 60s)
- Browser-side localStorage for cart persistence
- Image CDN with 24h minimum cache TTL
