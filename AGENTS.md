<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:graphify -->
# Graphify

This project has graphify set up for knowledge graph exploration.

- Run `/graphify` to build a knowledge graph of the codebase
- Output goes to `graphify-out/` (gitignored)
- Use `/graphify query "<question>"` to explore the graph
<!-- END:graphify -->

# CloudCommerce — Agent Guide

## Package manager
- **Bun only**. Never use npm, yarn, pnpm. All commands: `bun install`, `bun run dev`, `bun run build`, `bunx ...`.

## Quick commands

| Action | Command |
|--------|---------|
| Dev server | `bun run dev` (port 3000, starts WS server on 3001) |
| WS server | `bun run ws:start` (standalone, port 3001) |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` (tsc --noEmit) |
| Build | `bun run build` (includes full typecheck) |
| Unit tests | `bun run test` (vitest) |
| Unit tests (watch) | `bun run test:watch` |
| Coverage | `bun run test:coverage` |
| E2E tests | `bun run test:e2e` (playwright) |
| DB seed | `bun run db:seed` |
| DB reset | `bun run db:reset` |
| DB studio | `bun run db:studio` |
| Prisma generate | `bunx prisma generate` |
| Prisma migrate | `bunx prisma migrate dev` |

**Run order**: `lint` → `typecheck` (or `build`) → `test` before pushing.

## Tech stack
- Next.js 16 (App Router, Turbopack), TypeScript 6 strict
- React 19 with **React Compiler** enabled (`reactCompiler: true` in next.config.ts)
- Tailwind CSS 4 (`@tailwindcss/postcss` — not v3 config format)
- shadcn/ui primitives in `src/components/ui/`
- Prisma 7 + PostgreSQL (`@prisma/adapter-pg` — PgBouncer compatible)
- Zod 4, React Hook Form 7, TanStack Query 5

## Auth
- **Custom session-based auth** (NOT Clerk). Clerk references in docs/.env.example are stale.
- Password hashing: pbkdf2 (sha512, 100k iterations) in `src/lib/auth.ts`
- Session tokens in httpOnly cookie `cc_session_token`, stored in DB, 7-day expiry
- Auth context: `src/contexts/AuthContext.tsx` (client), `src/lib/get-session.ts` (server)
- API routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`
- Dashboard middleware in `src/proxy.ts` checks auth for `/merchant`, `/admin`, `/account`

## Architecture
- **Multi-tenant**: subdomain-based routing, `tenantId` on all data models
- **API**: REST at `/api/v1/` — requires `x-tenant-id` header
- **Proxy** (`src/proxy.ts`, not a real middleware.ts): CSP, security headers, auth redirects, rate limiting (100 req/min/IP)
- **Repository pattern**: `BaseRepository<T>` in `src/lib/repository.ts` with automatic audit logging
- **Soft deletes**: `deletedAt` nullable column on Product, Category, ProductVariant
- **Service layer**: `src/lib/services/` holds business logic, called by API route handlers
- **Payment providers** (provider pattern): Stripe, Khalti, eSewa — factory `getProvider(name)` in `src/lib/payments/`
- **Storage auto-selects**: Cloudflare R2 → AWS S3 → Local (`public/uploads/`)
- **Feature gating**: Plan-based (Starter/Growth/Enterprise) in `src/lib/features.ts`
- **Caching**: Redis (`src/lib/redis.ts`) with namespace keys — auto-connects Upstash → Redis Cloud → localhost:6379
- **Roles**: owner (admin/merchant) → full CRUD, staff → create/read/update, customer → none

## Project structure
```
src/
  app/              # Next.js App Router
    (dashboard)/    # admin/, merchant/
    (storefront)/   # store/
    api/v1/         # REST API (21 resource modules)
    api/auth/       # login, register, logout, me
  components/
    ui/             # shadcn/ui primitives (re-exported from ~50 @radix-ui packages)
    cc/views/       # page-level view components
    dashboard/      # dashboard widgets, charts
    storefront/     # customer-facing components
  contexts/         # AuthContext, CartContext, AppContext
  lib/
    services/       # business logic (21 modules)
    payments/       # Stripe, Khalti, eSewa implementations
    security/       # CSRF, rate limiting
    upload/         # storage providers
    webhooks/       # webhook processing + retry queue
    repository.ts   # BaseRepository<T>
  hooks/            # useCart, useToast, useMobile
  data/             # mock data fallback
```

## Tsconfig quirks
- `@/*` maps to `src/*`
- `tsconfig.json` **excludes** `*.config.ts` and `src/__tests__` from typechecking
- CI runs `bun run build` (not `typecheck`) for the typecheck job because build includes full type check

## Realtime (WebSocket)
- **Standalone WS server** at `src/ws-server.ts` — runs on port 3001, uses `ws` package (Node.js compatible)
- **Events**: `order.created`, `order.payment_received`, `order.shipped`, `order.cancelled`
- **Flow**: Order service → `OrderEventPublisher` → Redis Pub/Sub (`orders:{tenantId}`) → WS Server → Dashboard
- **Auth**: validates `cc_session_token` cookie on connect, extracts `tenantId` for scoping
- **Client hook**: `useOrderWebSocket()` in `src/hooks/useOrderWebSocket.ts` (auto-reconnect, heartbeat, history replay)
- **Widget**: `src/components/dashboard/merchant/live-orders-feed.tsx` replaces the static Recent Orders on merchant dashboard
- **Dev**: `bun run dev` runs both Next.js and WS server via `concurrently`
- **History**: last 50 events per tenant stored in Redis (`orders:{tenantId}:history`) — replayed on reconnect
- `NEXT_PUBLIC_WS_URL` env var overrides the default `ws://hostname:3001` client URL

## Important constraints
- **No middleware.ts** exists at project root. CSP/auth/rate-limiting live in `src/proxy.ts`, imported by route handlers.
- `.env` (checked in) contains dev mock values. Sensitive values go in `.env.production` or `.env.local`.
- `.env.example` mentions Clerk and Sentry — these are not wired into current code.
- `Dockerfile` runs as non-root `nextjs` user.
- `/api/webhooks/` paths bypass auth and rate limiting in proxy.
- `openFormat` / `closeFormat` route handler naming (from Next.js docs) appears in community graph nodes — ignore the generic names.

## Graphify (knowledge graph)
- Graph at `graphify-out/` — use `/graphify query "<question>"` for cross-module questions
- After modifying code, run `graphify update .` (AST-only, no API cost)
- See graphify-out/GRAPH_REPORT.md for architecture overview and community structure
