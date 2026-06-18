# Customer Account System — Phase 3 Sprint 2

## Goal

Build a full customer account system for storefront shoppers: register, login, manage profile and addresses, view order history. Tenant-isolated, production-ready, following existing codebase patterns.

## Schema Changes

### Address model — add optional `userId`

```prisma
model Address {
  id         String   @id @default(cuid())
  customerId String?                         // existing — merchant-managed customers
  userId     String?                         // NEW — self-service customer accounts
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

  @@index([userId])
}
```

The existing `customerId` path is untouched — merchant-managed customer addresses still work. New code uses `userId`.

## API Endpoints

All new endpoints under `/api/v1/account/*` and `/api/v1/auth/customer/*`.

### Customer Auth (`/api/v1/auth/customer/*`)
No auth required on these endpoints.

| Method | Path | Body | Response | Purpose |
|--------|------|------|----------|---------|
| POST | `/api/v1/auth/customer/register` | `{ email, password, name, tenantId }` | `{ user }` + cookie | Register with tenant context. Also auto-creates a `Customer` record (email + name + tenantId) so order lookups work. |
| POST | `/api/v1/auth/customer/login` | `{ email, password }` | `{ user }` + cookie | Login |
| POST | `/api/v1/auth/customer/logout` | — | `{ success }` | Clear session cookie |

### Customer Account (`/api/v1/account/*`)
All require valid session + `role === "customer"`. Tenant isolation via `User.tenantId`.

| Method | Path | Body/Params | Response | Purpose |
|--------|------|-------------|----------|---------|
| GET | `/api/v1/account/profile` | — | `{ id, email, name, phone }` | Get profile |
| PUT | `/api/v1/account/profile` | `{ name?, phone? }` | `{ id, email, name, phone }` | Update profile |
| GET | `/api/v1/account/orders` | `?page=1&limit=10` | `{ orders, total, page, limit }` | List customer orders |
| GET | `/api/v1/account/orders/[id]` | — | `{ order }` | Order detail with items |
| GET | `/api/v1/account/addresses` | — | `[ address ]` | List addresses |
| POST | `/api/v1/account/addresses` | `{ label, line1, line2?, city, state, zip, country?, isDefault? }` | `{ address }` | Create address |
| PUT | `/api/v1/account/addresses/[id]` | `{ label?, ... }` | `{ address }` | Update address |
| DELETE | `/api/v1/account/addresses/[id]` | — | `{ success }` | Delete address |
| PUT | `/api/v1/account/addresses/[id]/default` | — | `{ address }` | Set as default (unsets others) |

### Security

Every account endpoint:
1. Reads session token from `cc_session_token` cookie via `getSessionUser()`
2. Returns 401 if no valid session
3. Returns 403 if `role !== "customer"`
4. Scopes all queries to `user.tenantId`
5. Address CRUD checks `address.userId === session.user.id` before mutations
6. Order queries filter by `customerId` — looked up via the Customer record auto-created during registration (matched by email + tenantId from session)

## Pages

Route structure under `(storefront)/store/[tenant]/`:

```
auth/
  login/page.tsx             — Customer login form (email + password)
  register/page.tsx          — Customer registration form (name + email + password)
account/
  layout.tsx                 — Existing sidebar nav, enhanced with auth guard (redirect to login if no session)
  page.tsx                   — Redirect to /account/profile
  profile/page.tsx           — Profile edit: name, email (read-only), phone — React Hook Form + Zod
  orders/page.tsx            — Order history list from real DB — replace existing demo data
  orders/[id]/page.tsx       — Order detail: items, totals, status timeline
  addresses/page.tsx         — Address list with CRUD via Sheet drawer
```

### Auth guard (account/layout.tsx)
- Client-side check: calls `/api/v1/account/profile` on mount
- If 401/403 → redirect to `/store/{tenant}/auth/login?redirect={current_path}`
- If valid → render children

### Login page
- `useState` for email/password
- POST to `/api/v1/auth/customer/login`
- On success → `router.push(redirect || "/store/{tenant}/account")`
- Show error toast on failure

### Register page
- React Hook Form with Zod resolver
- Fields: name, email, password (min 6 chars)
- POST to `/api/v1/auth/customer/register` with `tenantId` from URL param
- On success → `router.push("/store/{tenant}/account")`

### Profile page
- React Hook Form with Zod resolver
- Fetches current data from `GET /api/v1/account/profile` on mount
- Fields: name (editable), email (read-only display), phone (editable)
- PUT to `/api/v1/account/profile` on submit
- Success toast on update

### Orders page
- Fetches `GET /api/v1/account/orders?page=1` on mount
- Table/card list with order number, status badge, date, total
- Click row → navigate to `/account/orders/[id]`
- Empty state with CTA to shop
- Pagination

### Order detail page
- Fetches `GET /api/v1/account/orders/[id]` on mount
- Shows order number, status, date, timeline
- Line items table: image, name, SKU, qty, price
- Totals: subtotal, shipping, tax, total
- Shipping address

### Addresses page
- Fetches list on mount
- Each address card: label, full address, "Default" badge
- Actions: Edit (opens Sheet), Delete (with confirm), Set Default
- "Add Address" button → opens empty Sheet form
- Sheet contains React Hook Form + Zod address form
- On create/update/delete → refetch list, toast

## Validation Schemas

```typescript
// Zod schemas (to be added in src/lib/schemas.ts)
export const customerRegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).optional(),
  phone: z.string().max(20).optional(),
});
```

Existing `addressSchema` reused as-is for address forms.

## Dependencies

None new. React Hook Form, Zod, and shadcn/ui are already in the project.

## Implementation Order

1. Schema migration (add `userId` to Address)
2. Customer auth API routes (`/api/v1/auth/customer/*`)
3. Account profile API (`/api/v1/account/profile`)
4. Account orders API (`/api/v1/account/orders/*`)
5. Account addresses API (`/api/v1/account/addresses/*`)
6. Customer auth pages (login, register)
7. Account layout with auth guard
8. Profile page
9. Orders pages (list + detail)
10. Addresses page with CRUD Sheet
11. Wire up proxy.ts middleware for `/api/v1/account/*` path protection
