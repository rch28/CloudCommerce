# CloudCommerce Dashboard Port — Design Spec

## Overview

Port the full CloudCommerce SaaS dashboard UI from the reference project (`nextjs-converted-app`) into the current Next.js 16 project (`CloudCommerce`). The reference is a dark-themed multi-tenant e-commerce dashboard with 8 views, mock data, auth simulation, and shadcn/ui-style components.

## Architecture

### Route Structure

Each view gets its own Next.js App Router page under route groups:

```
/merchant/dashboard     → DashboardView (revenue charts, stats, recent orders)
/merchant/products      → ProductsView (grid with category filter + search)
/merchant/orders        → OrdersView (table with status filter + search)
/merchant/inventory     → InventoryView (stock table with simulated real-time)
/merchant/customers     → CustomersView (customer cards + search)
/merchant/storefront    → StorefrontView (customer-facing store + cart + newsletter)
/merchant/settings      → SettingsView (branding, domains, billing)

/admin                  → AdminView (all merchants table + revenue chart)
/admin/settings         → SettingsView (same settings component, platform-level)
```

All routes are under `src/app/(dashboard)/` to share a common layout. The dashboard layout renders the Sidebar + Topbar shell with `{children}` for the page content.

### Marketing Page

The existing `(marketing)/page.tsx` stays unchanged at `/` (landing page).

## Component Tree

```
<html>
  <ThemeProvider>           ← custom dark/light/system provider
    <QueryClientProvider>  ← TanStack React Query (wired up for future use)
      <TooltipProvider>    ← Radix Tooltip
        <Toaster />        ← shadcn toast renderer
        <Sonner />         ← Sonner toast renderer
        <AuthProvider>     ← auth context (session, signIn, signUp, signOut, role switching)
          <AppProvider>    ← app context (sidebar state)
            <DashboardLayout>      ← Sidebar + Topbar + {children}
              <Sidebar />          ← nav sidebar (merchant or platform nav)
              <Topbar />           ← header with search, notifications, user dropdown
              {children}           ← the active page component
              <AuthModal />        ← sign-in/sign-up modal (overlay)
```

### Data Flow

- **Auth state**: `AuthContext` manages session (localStorage-persisted). Role determines which nav items and views are accessible.
- **Sidebar state**: `AppContext` manages mobile sidebar open/close.
- **Search state**: Each page manages its own search/filter state locally (no global search lifting needed since pages are independent routes).
- **Mock data**: All data from `src/data/mock.ts` — products, orders, merchants, customers, chart data.
- **No server-side data fetching**: All data is client-side mock data for now. The `getMe()` API endpoint in the current project can be replaced by the AuthContext approach.

## File Structure

```
src/
├── app/
│   ├── globals.css                    # Tailwind v4 + CSS variables (converted from reference)
│   ├── layout.tsx                     # Root layout with ThemeProvider + providers
│   ├── (marketing)/page.tsx           # Unchanged landing page
│   └── (dashboard)/
│       ├── layout.tsx                 # Dashboard layout: Sidebar + Topbar + AuthModal
│       ├── merchant/
│       │   ├── dashboard/page.tsx     # DashboardView
│       │   ├── products/page.tsx      # ProductsView
│       │   ├── orders/page.tsx        # OrdersView
│       │   ├── inventory/page.tsx     # InventoryView
│       │   ├── customers/page.tsx     # CustomersView
│       │   ├── storefront/page.tsx    # StorefrontView
│       │   └── settings/page.tsx      # SettingsView
│       └── admin/
│           ├── page.tsx               # AdminView
│           └── settings/page.tsx      # SettingsView
├── components/
│   ├── ui/                            # 35+ shadcn components (ported from reference)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   ├── toast.tsx / toaster.tsx
│   │   ├── sonner.tsx
│   │   ├── sidebar.tsx (shadcn sidebar primitives)
│   │   ├── sheet.tsx
│   │   ├── table.tsx
│   │   ├── input.tsx / select.tsx / tabs.tsx
│   │   ├── badge.tsx / avatar.tsx
│   │   ├── chart.tsx (recharts wrapper)
│   │   ├── accordion.tsx
│   │   └── ... (all shadcn components from reference)
│   └── cc/
│       ├── Sidebar.tsx                # Navigation sidebar (merchant + platform nav)
│       ├── Topbar.tsx                 # Header with search, notifications, user menu
│       ├── AuthModal.tsx              # Sign-in/sign-up modal with onboarding wizard
│       ├── StatCard.tsx               # Dashboard stat card
│       ├── Badge.tsx                  # Status badge
│       └── views/
│           ├── DashboardView.tsx
│           ├── ProductsView.tsx
│           ├── OrdersView.tsx
│           ├── InventoryView.tsx
│           ├── CustomersView.tsx
│           ├── StorefrontView.tsx
│           ├── AdminView.tsx
│           └── SettingsView.tsx
├── contexts/
│   ├── AuthContext.tsx                # Auth (session, signIn, signUp, signOut, role)
│   └── AppContext.tsx                 # Sidebar state
├── hooks/
│   ├── use-toast.ts                   # Toast reducer + dispatch
│   └── use-mobile.tsx                 # Mobile breakpoint detection
├── data/
│   └── mock.ts                        # Products, orders, merchants, customers, chart data
└── lib/
    └── utils.ts                       # cn() helper (clsx + tailwind-merge)
```

## Tailwind v4 Migration

The reference uses Tailwind v3 with shadcn HSL CSS variables. These need to be converted to v4-compatible form.

### Strategy
- Keep the same CSS variable names (`--background`, `--primary`, etc.)
- Define them in `globals.css` as plain CSS custom properties on `:root` and `.dark`
- Reference them in `@theme inline { }` block for Tailwind v4 theme tokens
- The shadcn components use class names like `bg-background`, `text-foreground`, `border-border` — these will work with the `@theme` block

### CSS Variable Conversion (HSL → hex/rgb/hsl)
The reference uses HSL values like `--background: 222.2 84% 4.9%`. Tailwind v4 can consume these as-is via `hsl()` in the `@theme` block or directly in CSS. We'll convert to the format:
```css
:root {
  --background: hsl(222.2 84% 4.9%);
  /* or keep as raw values and use them in @theme */
}
```

## Key Adaptations from Reference

1. **Sidebar navigation**: Reference used state-based `onChange` prop. With Next.js routes, sidebar items use `next/navigation`'s `useRouter` + `usePathname` to navigate to and highlight the current route. The `View` type is replaced by path-based matching.

2. **Topbar search**: Reference lifted search state up to AppLayout. With separate pages, each view handles its own search state locally. The Topbar search field is removed; search is handled per-page if needed.

3. **Role-based access**: Reference redirected in AppLayout via useEffect. With routes, we use a client-side guard or middleware. For now, both `/merchant/*` and `/admin/*` are accessible; the sidebar nav only shows relevant items based on role.

4. **Dashboard layout**: The dashboard `layout.tsx` wraps all admin/merchant routes with Sidebar + Topbar + AuthModal. This replaces the reference's `AppLayout.tsx`.

5. **Page titles**: Reference had a `titles` record. Each page now sets its own title via the Topbar — the Topbar gets the title from the page component or we can store it in the layout state.

6. **404 page**: Reference had a basic not-found. The current project doesn't have one; we can add one if needed.

## Providers at Root Level

The root `layout.tsx` wraps children with:
- `ThemeProvider` (custom, not `next-themes` since it doesn't depend on it)
- `QueryClientProvider` (wired up for future API use)
- `TooltipProvider` (Radix)
- `Toaster` + `Sonner` (toast renderers — rendered at root level, not wrapping)

The dashboard layout wraps content with:
- `AuthProvider`
- `AppProvider`

## Dependencies

All required packages are already in `package.json`. No new installs needed.

## CSS Variable Definitions

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --background: hsl(210 40% 98%);
  --foreground: hsl(222.2 84% 4.9%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(221 83% 53%);
  --primary-foreground: hsl(210 40% 98%);
  --secondary: hsl(210 40% 96.1%);
  --secondary-foreground: hsl(222.2 47.4% 11.2%);
  --muted: hsl(210 40% 96.1%);
  --muted-foreground: hsl(215.4 16.3% 46.9%);
  --accent: hsl(210 40% 96.1%);
  --accent-foreground: hsl(222.2 47.4% 11.2%);
  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(210 40% 98%);
  --border: hsl(214.3 31.8% 91.4%);
  --input: hsl(214.3 31.8% 91.4%);
  --ring: hsl(221 83% 53%);
  --radius: 0.5rem;
  --sidebar-background: hsl(220 23% 95%);
  --sidebar-foreground: hsl(215 25% 27%);
  --sidebar-primary: hsl(221 83% 53%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(220 14% 90%);
  --sidebar-accent-foreground: hsl(215 25% 27%);
  --sidebar-border: hsl(220 13% 91%);
  --sidebar-ring: hsl(221 83% 53%);
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  --card: hsl(222.2 84% 4.9%);
  --card-foreground: hsl(210 40% 98%);
  --primary: hsl(217.2 91.2% 59.8%);
  --primary-foreground: hsl(222.2 47.4% 11.2%);
  --secondary: hsl(217.2 32.6% 17.5%);
  --secondary-foreground: hsl(210 40% 98%);
  --muted: hsl(217.2 32.6% 17.5%);
  --muted-foreground: hsl(215 20.2% 65.1%);
  --accent: hsl(217.2 32.6% 17.5%);
  --accent-foreground: hsl(210 40% 98%);
  --destructive: hsl(0 62.8% 30.6%);
  --destructive-foreground: hsl(210 40% 98%);
  --border: hsl(217.2 32.6% 17.5%);
  --input: hsl(217.2 32.6% 17.5%);
  --ring: hsl(224.3 76.3% 48%);
  --sidebar-background: hsl(215 28% 17%);
  --sidebar-foreground: hsl(210 40% 98%);
  --sidebar-primary: hsl(217.2 91.2% 59.8%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(215 25% 27%);
  --sidebar-accent-foreground: hsl(210 40% 98%);
  --sidebar-border: hsl(215 25% 27%);
  --sidebar-ring: hsl(217.2 91.2% 59.8%);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar-background: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius: 0.5rem;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

## Verification

After implementation, verify:
- `npm run dev` starts without errors
- All dashboard routes render with correct layout (sidebar + topbar + content)
- Dark theme applies correctly
- Auth modal opens/closes
- Sidebar navigation switches between views
- Role switching works (merchant ↔ admin changes nav items)
- Toast notifications can be triggered
