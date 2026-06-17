# CloudCommerce Setup Guide

## Prerequisites

- Node.js 22+
- Bun (package manager)
- PostgreSQL 16+
- A Clerk account (for auth)

## Quick Start

```bash
# Clone and install
git clone <repo> && cd cloudcommerce
bun install

# Copy environment
cp .env.example .env.local
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cloudcommerce"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe (optional - for payment processing)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Sentry (optional - for error monitoring)
SENTRY_DSN=https://...

# CSRF
CSRF_SECRET=<random-64-char-string>

# Logging
LOG_LEVEL=info
```

## Database Setup

```bash
# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# (Optional) Seed plans
bunx prisma db seed
```

## Run Development

```bash
bun run dev
# Opens at http://localhost:3000
```

## Testing

```bash
# Unit tests
bun vitest run

# Unit tests (watch mode)
bun vitest

# E2E tests
bunx playwright install
bunx playwright test

# Coverage
bun vitest run --coverage
```

## Linting & Type Checking

```bash
bun run lint
bun run build        # Includes full type check
```

## Environment Files

| File              | Purpose                |
|-------------------|------------------------|
| `.env.local`      | Local development      |
| `.env.production` | Production secrets     |
| `.env.test`       | CI / test environment  |
