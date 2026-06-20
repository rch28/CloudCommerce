# CloudCommerce Admin & Merchant Guide

## Getting Started

### Demo Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Platform Admin | admin@cloudcommerce.com | admin123 | /admin |
| Merchant | merchant@demo.com | merchant123 | /merchant |

### Login Flow

1. Go to `/auth/login` — redirects to the login page
2. Enter credentials — on success, redirects to the appropriate dashboard:
   - Admin → `/admin` (platform-wide management)
   - Merchant → `/merchant` (their own store)
3. If accessing a protected page while unauthenticated, the system automatically redirects to `/auth/login?redirect=/original/path`

### Logout

- Click the user avatar (top-right) → "Sign out"
- Redirects to `/`
- Session cookie (`cc_session_token`) is destroyed server-side

### Switch Role (Admin Only)

Admins can impersonate the merchant view without logging out:
- Click avatar → "Switch to Merchant"
- This changes the sidebar to show Merchant Management items
- Click avatar → "Switch to Platform Admin" to go back

---

## Admin Dashboard (`/admin`)

The admin panel provides a platform-wide view of all merchants, stores, orders, and revenue.

### Features

- **Stats Cards**: Total Merchants, Active Stores, Platform Revenue, Orders Today (with % change)
- **Revenue Chart**: Monthly platform revenue bar chart
- **Merchant Growth Chart**: Active vs Total merchant area chart
- **Recent Merchants Table**: Shows the 6 most recently created tenants
- **Recent Activity Feed**: Audit log stream showing system events

### Navigation

Admin sees two nav sections in the sidebar:

**Merchant Management** (all merchant features):
- Dashboard, Products, Orders, Customers, Discounts, Reviews, Content, Tax, Loyalty, Shipping, Inventory, Reports, Settings

**Platform**:
- Admin Dashboard, Platform Settings

---

## Merchant Dashboard (`/merchant`)

The merchant panel manages a single tenant's store.

### Features

- Products CRUD with variants, options, images
- Order management with status transitions
- Customer management
- Discounts (coupons + promotions)
- Reviews moderation
- CMS (pages, banners, sections)
- Tax zones & rates
- Loyalty program (accounts, transactions, reward rules)
- Shipping zones & methods
- Warehouse & inventory management
- Reports & analytics
- Store settings (branding, domain, contact info)

---

## Seed Data

Populate the database with realistic demo data:

```bash
bunx prisma db seed
```

This creates:

| Entity | Count | Details |
|--------|-------|---------|
| Tenants | 2 | Platform + Demo Merchant |
| Users | 2 | admin@ / merchant@ |
| Plans | 3 | Starter ($29), Growth ($79), Scale ($199) |
| Subscription | 1 | Demo Merchant → Growth |
| Store | 1 | Demo Store Co. |
| Categories | 4 | Audio, Wearables, Accessories, Featured |
| Products | 8 | 18 variants, 16 images |
| Customers | 6 | With contact info |
| Orders | 8 | Various statuses (pending→delivered) |
| Tax Zones | 2 | US (8%), CA (10%) |
| CMS Pages | 2 | Home + About with sections |
| Banners | 2 | Summer Sale, New Arrivals |
| Loyalty Accounts | 2 | Bronze (250pts), Silver (1200pts) |
| Reward Rules | 3 | Purchase Points, Welcome Bonus, Birthday Bonus |
| Warehouses | 2 | NY (main), CA (west coast) |
| Coupons | 2 | WELCOME10 (10% off), FREESHIP (free shipping) |
| Shipping | 2 zones, 2 methods | Standard ($5.99), Express ($14.99) |
| Notifications | 5 | Orders, inventory, etc. |
| Audit Logs | 5 | Recent actions |

The seed is idempotent — safe to run multiple times.

---

## Database Commands

```bash
bunx prisma migrate dev         # Apply pending migrations
bunx prisma generate            # Regenerate Prisma client
bunx prisma db seed             # Seed demo data
bunx prisma db reset            # Drop + recreate + seed
bunx prisma studio              # GUI database browser
```

---

## API Reference

REST API at `/api/v1/` — requires `x-tenant-id` header and authentication.

### Available Modules

| Route | Description |
|-------|-------------|
| `/api/v1/products` | Product CRUD with variants, options, images |
| `/api/v1/orders` | Order management (list, create, update status) |
| `/api/v1/customers` | Customer management |
| `/api/v1/categories` | Category tree management |
| `/api/v1/coupons` | Coupon CRUD |
| `/api/v1/promotions` | Promotion CRUD |
| `/api/v1/tax` | Tax zone & rate management |
| `/api/v1/cms` | Pages, sections, banners |
| `/api/v1/loyalty` | Accounts, transactions, reward rules |
| `/api/v1/warehouses` | Warehouse & inventory management |
| `/api/v1/shipping` | Shipping zones, methods, rates |
| `/api/v1/reviews` | Review moderation |
| `/api/v1/notifications` | Notification management |
| `/api/v1/reports` | Report generation |
| `/api/v1/settings` | Store settings |
| `/api/v1/admin/stats` | Admin dashboard aggregate stats |
| `/api/v1/analytics` | Merchant/admin analytics |
| `/api/auth/*` | Login, register, logout, session |

### Auth API

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/auth/login` | POST | `{ email, password }` | `{ user, session }` |
| `/api/auth/register` | POST | `{ email, password, name, role }` | `{ user }` |
| `/api/auth/logout` | POST | — | 200 OK |
| `/api/auth/me` | GET | — | `{ loggedIn, user }` or `{ loggedIn: false }` |

---

## System Architecture

### Auth Flow

```
Browser → Login Page → POST /api/auth/login
  → verifyPassword(email, password) → createSession(userId)
  → setSessionCookie(response, token) → redirect to dashboard
  → AuthContext fetches /api/auth/me on mount
  → AuthGuard in layout checks session (redirects to /auth/login if null)
```

### Protected Routes

- `/merchant/*`, `/admin/*`, `/account/*` are protected
- Dashboard layout wraps content in `<AuthGuard>` — shows spinner while loading, null while redirecting
- `proxy.ts` adds a server-side check for cookie (fallback — primarily relies on client-side guard in the layout)

### Directory Structure

```
src/
  app/
    (dashboard)/         # Admin + Merchant dashboards
    (storefront)/        # Customer-facing store
    api/v1/              # REST API (21+ resource modules)
    api/auth/            # Auth endpoints
  components/
    dashboard/           # Layout shell (sidebar, topbar, stats)
    cc/views/            # Feature views for dashboard tabs
    storefront/          # Customer-facing components
  contexts/
    AuthContext.tsx       # Auth state provider
    CartContext.tsx       # Cart state (customer)
  lib/
    services/            # Business logic layer
    payments/            # Payment provider pattern
    security/            # CSRF, rate limiting
  data/mock.ts           # Fallback mock data
```

---

## Development

```bash
bun run dev               # Next.js + WS server (port 3000 + 3001)
bun run lint              # ESLint
bun run typecheck         # tsc --noEmit
bun run build             # Full production build
bun run test              # Vitest
bun run test:e2e          # Playwright E2E
```

Run `lint` → `typecheck` (or `build`) → `test` before pushing.
