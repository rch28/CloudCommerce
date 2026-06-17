# CloudCommerce Dashboard Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the full dark-themed SaaS dashboard UI from the reference project into the current Next.js 16 app with proper routes, Tailwind v4 conversion, and Next.js App Router conventions.

**Architecture:** Each view gets its own route under `(dashboard)/merchant/*` and `(dashboard)/admin/*`. The dashboard layout wraps all routes with Sidebar + Topbar + AuthModal. Auth is client-side mock via AuthContext. All data is in-memory mock data. The existing marketing landing page at `/` stays unchanged.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn/ui-style components (Radix primitives), recharts, lucide-react, sonner, TanStack React Query (wired up), next-themes (installed but custom theme provider used).

---

## File Map

### Files to CREATE (73 total):

Infrastructure:
- `src/lib/utils.ts`
- `src/data/mock.ts`
- `src/hooks/use-toast.ts`
- `src/hooks/use-mobile.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/AppContext.tsx`
- `src/components/theme-provider.tsx`

UI Components (shadcn — all under `src/components/ui/`):
- `button.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`
- `toast.tsx`, `toaster.tsx`, `sonner.tsx`, `sheet.tsx`, `table.tsx`
- `input.tsx`, `select.tsx`, `tabs.tsx`, `badge.tsx`, `avatar.tsx`
- `chart.tsx`, `accordion.tsx`, `alert-dialog.tsx`, `aspect-ratio.tsx`
- `checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`
- `drawer.tsx`, `form.tsx`, `hover-card.tsx`, `input-otp.tsx`
- `label.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `popover.tsx`
- `progress.tsx`, `radio-group.tsx`, `scroll-area.tsx`, `separator.tsx`
- `sidebar.tsx`, `skeleton.tsx`, `slider.tsx`, `switch.tsx`
- `textarea.tsx`, `toggle.tsx`, `toggle-group.tsx`

Custom CC Components:
- `src/components/cc/Sidebar.tsx`
- `src/components/cc/Topbar.tsx`
- `src/components/cc/AuthModal.tsx`
- `src/components/cc/StatCard.tsx`
- `src/components/cc/Badge.tsx`

Views:
- `src/components/cc/views/DashboardView.tsx`
- `src/components/cc/views/ProductsView.tsx`
- `src/components/cc/views/OrdersView.tsx`
- `src/components/cc/views/InventoryView.tsx`
- `src/components/cc/views/CustomersView.tsx`
- `src/components/cc/views/StorefrontView.tsx`
- `src/components/cc/views/AdminView.tsx`
- `src/components/cc/views/SettingsView.tsx`

Route Pages:
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/merchant/dashboard/page.tsx`
- `src/app/(dashboard)/merchant/products/page.tsx`
- `src/app/(dashboard)/merchant/orders/page.tsx`
- `src/app/(dashboard)/merchant/inventory/page.tsx`
- `src/app/(dashboard)/merchant/customers/page.tsx`
- `src/app/(dashboard)/merchant/storefront/page.tsx`
- `src/app/(dashboard)/merchant/settings/page.tsx`
- `src/app/(dashboard)/admin/settings/page.tsx`

### Files to MODIFY (3):
- `src/app/globals.css` — replace with shadcn CSS variables + v4 theme
- `src/app/layout.tsx` — wrap with providers
- `src/app/(dashboard)/admin/page.tsx` — replace placeholder with AdminView

### Files to DELETE (1):
- `src/app/(dashboard)/merchant/page.tsx` — replaced by route group with sub-pages

---

### Task 1: Core Infrastructure (utils, mock data, hooks, contexts)

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/data/mock.ts`
- Create: `src/hooks/use-toast.ts`
- Create: `src/hooks/use-mobile.tsx`
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/contexts/AppContext.tsx`
- Create: `src/components/theme-provider.tsx`

- [ ] **Step 1: Create `src/lib/utils.ts`**

Write the cn() helper:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Create `src/data/mock.ts`**

Write the mock data file. Content is extracted from the reference project's `src/data/mock.ts` (119 lines — products, orders, merchants, customers, revenueData, categoryData).

Copy all content from `/home/rch/Programming/Projects/nextjs-converted-app/src/data/mock.ts`. Change import paths as needed (none in this file).

- [ ] **Step 3: Create `src/hooks/use-toast.ts`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/hooks/use-toast.ts`. Change the import:
```ts
// Replace:
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";
// with the same path — it's correct for our structure.
```

- [ ] **Step 4: Create `src/hooks/use-mobile.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/hooks/use-mobile.tsx` (24 lines, no dependency changes).

- [ ] **Step 5: Create `src/contexts/AuthContext.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/contexts/AuthContext.tsx` (85 lines, no dependency changes).

- [ ] **Step 6: Create `src/contexts/AppContext.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/contexts/AppContext.tsx` (39 lines, no dependency changes).

- [ ] **Step 7: Create `src/components/theme-provider.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/components/theme-provider.tsx` (77 lines, no dependency changes).

---

### Task 2: CSS Variables + Root Layout

**Files:**
- Modify: `src/app/globals.css` — replace entirely
- Modify: `src/app/layout.tsx` — wrap with providers

- [ ] **Step 1: Replace `src/app/globals.css` with v4-compatible shadcn variables**

Write the complete globals.css:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --background: hsl(210 40% 98%);
  --foreground: hsl(222.2 84% 4.9%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222.2 84% 4.9%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(222.2 84% 4.9%);
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
  --popover: hsl(222.2 84% 4.9%);
  --popover-foreground: hsl(210 40% 98%);
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
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
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

* {
  border-color: var(--border);
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

pre, code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

Replace with:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClientProvider } from "@/components/query-client-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "CloudCommerce",
  description: "Multi-tenant e-commerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="dark">
          <QueryClientProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create `src/components/query-client-provider.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider as Provider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <Provider client={queryClient}>{children}</Provider>;
}
```

---

### Task 3: UI Components — shadcn batch

**Files:** All `src/components/ui/*.tsx` files

- [ ] **Step 1: Copy all shadcn/ui components from reference**

For each UI component file in `/home/rch/Programming/Projects/nextjs-converted-app/src/components/ui/`, copy it to `CloudCommerce/src/components/ui/` with the same name.

Update the `@/lib/utils` import — it's already correct for our structure.

Key components and their dependencies on Radix packages (all already installed):

| File | Radix dependency |
|---|---|
| `button.tsx` | `@radix-ui/react-slot` |
| `card.tsx` | none |
| `dialog.tsx` | `@radix-ui/react-dialog` |
| `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` |
| `tooltip.tsx` | `@radix-ui/react-tooltip` |
| `toast.tsx` | `@radix-ui/react-toast` |
| `toaster.tsx` | depends on `toast.tsx` |
| `sonner.tsx` | `sonner` npm package |
| `sheet.tsx` | `@radix-ui/react-dialog` |
| `table.tsx` | none |
| `input.tsx` | none |
| `select.tsx` | `@radix-ui/react-select` |
| `tabs.tsx` | `@radix-ui/react-tabs` |
| `badge.tsx` | none |
| `avatar.tsx` | `@radix-ui/react-avatar` |
| `chart.tsx` | recharts |
| `accordion.tsx` | `@radix-ui/react-accordion` |
| `alert-dialog.tsx` | `@radix-ui/react-alert-dialog` |
| `checkbox.tsx` | `@radix-ui/react-checkbox` |
| `collapsible.tsx` | `@radix-ui/react-collapsible` |
| `command.tsx` | `cmdk` |
| `context-menu.tsx` | `@radix-ui/react-context-menu` |
| `drawer.tsx` | `vaul` |
| `form.tsx` | `react-hook-form` + `@radix-ui/react-label` |
| `hover-card.tsx` | `@radix-ui/react-hover-card` |
| `input-otp.tsx` | `input-otp` |
| `label.tsx` | `@radix-ui/react-label` |
| `menubar.tsx` | `@radix-ui/react-menubar` |
| `navigation-menu.tsx` | `@radix-ui/react-navigation-menu` |
| `popover.tsx` | `@radix-ui/react-popover` |
| `progress.tsx` | `@radix-ui/react-progress` |
| `radio-group.tsx` | `@radix-ui/react-radio-group` |
| `scroll-area.tsx` | `@radix-ui/react-scroll-area` |
| `separator.tsx` | `@radix-ui/react-separator` |
| `sidebar.tsx` | multiple radix deps |
| `skeleton.tsx` | none |
| `slider.tsx` | `@radix-ui/react-slider` |
| `switch.tsx` | `@radix-ui/react-switch` |
| `textarea.tsx` | none |
| `toggle.tsx` | `@radix-ui/react-toggle` |
| `toggle-group.tsx` | `@radix-ui/react-toggle-group` |

No CSS changes needed for these files — they reference Tailwind utility classes like `bg-background` etc. which are now mapped via the `@theme inline` block.

---

### Task 4: Custom CC Components

**Files (all under `src/components/cc/`):**
- Create: `Sidebar.tsx`
- Create: `Topbar.tsx`
- Create: `AuthModal.tsx`
- Create: `StatCard.tsx`
- Create: `Badge.tsx`

- [ ] **Step 1: Create `src/components/cc/StatCard.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/StatCard.tsx` (37 lines, no dependency changes).

- [ ] **Step 2: Create `src/components/cc/Badge.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/Badge.tsx` (25 lines, no dependency changes).

- [ ] **Step 3: Create `src/components/cc/Sidebar.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/Sidebar.tsx` and adapt for Next.js routing. The reference used state-based `active` + `onChange`. Replace with `usePathname` + `useRouter` from `next/navigation`.

Replace the import and props:

```tsx
"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  Store,
  Building2,
  Settings,
  Zap,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = { id: string; label: string; path: string; icon: typeof LayoutDashboard };

const merchantNav: NavItem[] = [
  { id: "dashboard", label: "Overview", path: "/merchant/dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", path: "/merchant/products", icon: Package },
  { id: "orders", label: "Orders", path: "/merchant/orders", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", path: "/merchant/inventory", icon: Boxes },
  { id: "customers", label: "Customers", path: "/merchant/customers", icon: Users },
  { id: "storefront", label: "Storefront", path: "/merchant/storefront", icon: Store },
];

const platformNav: NavItem[] = [
  { id: "admin", label: "All Merchants", path: "/admin", icon: Building2 },
  { id: "settings", label: "Settings", path: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = session?.role === "admin";
  const storeLabel = session?.storeName || "Demo Store";

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = pathname === item.path;
    return (
      <button
        onClick={() => { router.push(item.path); onClose(); }}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? "bg-gradient-to-r from-violet-600/90 to-violet-700/70 text-white shadow-lg shadow-violet-900/30"
            : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
        }`}
      >
        <Icon size={18} />
        {item.label}
      </button>
    );
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/40">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">CloudCommerce</p>
              <p className="mt-1 text-[11px] text-slate-500">{storeLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {!isAdmin && (
            <>
              <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Merchant
              </p>
              {merchantNav.map((item) => <NavButton key={item.id} item={item} />)}
            </>
          )}

          <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            {isAdmin ? "Platform" : "Account"}
          </p>
          {(isAdmin ? platformNav : platformNav.filter((p) => p.id === "settings")).map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>

        <div className="m-3 rounded-xl border border-violet-800/40 bg-gradient-to-br from-violet-900/40 to-slate-900 p-4">
          <p className="text-sm font-semibold text-white">{session?.plan || "Scale"} Plan</p>
          <p className="mt-1 text-xs text-slate-400">Real-time sync · Unlimited products</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">7,500 / 10,000 orders this month</p>
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 4: Create `src/components/cc/Topbar.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/Topbar.tsx` (96 lines). Replace the `title` prop with `usePathname`-based title detection, OR accept it as a prop from the layout:

Keep the same interface but accept `title` as a prop from the layout. The layout will set it.

```tsx
"use client";
import { useState } from "react";
import { Menu, Search, Bell, ChevronDown, LogOut, Building2, ShoppingBag, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TopbarProps {
  title: string;
  onMenu: () => void;
  onSignIn: () => void;
}

export default function Topbar({ title, onMenu, onSignIn }: TopbarProps) {
  const { session, signOut, setRole } = useAuth();
  const [menu, setMenu] = useState(false);

  const initials = session
    ? session.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <button onClick={onMenu} className="text-slate-400 lg:hidden">
        <Menu size={22} />
      </button>
      <h1 className="text-lg font-semibold text-white sm:text-xl">{title}</h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button className="relative rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500" />
        </button>

        {session ? (
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-1.5 pr-2.5 hover:border-slate-700"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden text-sm font-medium text-white sm:inline">{session.name}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
                  <div className="border-b border-slate-800 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{session.name}</p>
                    <p className="truncate text-xs text-slate-500">{session.email}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium capitalize text-violet-300">
                      {session.role === "admin" ? <Building2 size={11} /> : <ShoppingBag size={11} />}
                      {session.role}
                    </span>
                  </div>
                  <button
                    onClick={() => { setRole(session.role === "admin" ? "merchant" : "admin"); setMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800"
                  >
                    {session.role === "admin" ? <ShoppingBag size={15} /> : <Building2 size={15} />}
                    Switch to {session.role === "admin" ? "Merchant" : "Platform Admin"}
                  </button>
                  <button
                    onClick={() => { signOut(); setMenu(false); }}
                    className="flex w-full items-center gap-2.5 border-t border-slate-800 px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-slate-800"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <LogIn size={16} /> Sign in
          </button>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create `src/components/cc/AuthModal.tsx`**

Copy from `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/AuthModal.tsx` (181 lines, no dependency changes).

---

### Task 5: View Components

**Files (all under `src/components/cc/views/`):**
- Create: `DashboardView.tsx`
- Create: `ProductsView.tsx`
- Create: `OrdersView.tsx`
- Create: `InventoryView.tsx`
- Create: `CustomersView.tsx`
- Create: `StorefrontView.tsx`
- Create: `AdminView.tsx`
- Create: `SettingsView.tsx`

- [ ] **Step 1: Create `DashboardView.tsx`**

Copy from reference `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/views/DashboardView.tsx` (114 lines, no dependency changes).

- [ ] **Step 2: Create `ProductsView.tsx`**

Copy from reference (90 lines). Change the interface — instead of accepting `search` as a prop, use local state:

```tsx
"use client";
import { useState } from "react";
import { Plus, Search, MoreVertical, Pencil } from "lucide-react";
import Badge from "../Badge";
import { products as allProducts } from "@/data/mock";

export default function ProductsView() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const cats = ["All", "Audio", "Wearables"];
  // ... rest same as reference
```

- [ ] **Step 3: Create `OrdersView.tsx`**

Copy from reference (73 lines). Same adaptation — use local search state instead of props:

```tsx
"use client";
import { useState } from "react";
import { Download, Search } from "lucide-react";
import Badge from "../Badge";
import { orders as allOrders } from "@/data/mock";

export default function OrdersView() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  // ... rest same
```

- [ ] **Step 4: Create `InventoryView.tsx`**

Copy from reference `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/views/InventoryView.tsx` (115 lines, no changes needed).

- [ ] **Step 5: Create `CustomersView.tsx`**

Copy from reference (44 lines). Use local search state:

```tsx
"use client";
import { useState } from "react";
import { Mail, Search } from "lucide-react";
import { customers as allCustomers } from "@/data/mock";

export default function CustomersView() {
  const [search, setSearch] = useState("");
  // ... rest same
```

- [ ] **Step 6: Create `StorefrontView.tsx`**

Copy from reference `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/views/StorefrontView.tsx` (179 lines, no changes needed).

- [ ] **Step 7: Create `AdminView.tsx`**

Copy from reference `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/views/AdminView.tsx` (81 lines, no changes needed).

- [ ] **Step 8: Create `SettingsView.tsx`**

Copy from reference `/home/rch/Programming/Projects/nextjs-converted-app/src/components/cc/views/SettingsView.tsx` (89 lines, no changes needed).

---

### Task 6: Dashboard Layout + Route Pages

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/merchant/dashboard/page.tsx`
- Create: `src/app/(dashboard)/merchant/products/page.tsx`
- Create: `src/app/(dashboard)/merchant/orders/page.tsx`
- Create: `src/app/(dashboard)/merchant/inventory/page.tsx`
- Create: `src/app/(dashboard)/merchant/customers/page.tsx`
- Create: `src/app/(dashboard)/merchant/storefront/page.tsx`
- Create: `src/app/(dashboard)/merchant/settings/page.tsx`
- Create: `src/app/(dashboard)/admin/settings/page.tsx`
- Modify: `src/app/(dashboard)/admin/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/layout.tsx`**

This is the shell layout with Sidebar + Topbar + AuthModal. It uses `usePathname` to determine the page title.

```tsx
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/cc/Sidebar";
import Topbar from "@/components/cc/Topbar";
import AuthModal from "@/components/cc/AuthModal";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

const titles: Record<string, string> = {
  "/merchant/dashboard": "Overview",
  "/merchant/products": "Products",
  "/merchant/orders": "Orders",
  "/merchant/inventory": "Inventory",
  "/merchant/customers": "Customers",
  "/merchant/storefront": "Storefront",
  "/admin": "All Merchants",
  "/admin/settings": "Settings",
  "/merchant/settings": "Settings",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();

  const title = titles[pathname] || "Dashboard";

  return (
    <AuthProvider>
      <AppProvider>
        <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-slate-200">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar
              title={title}
              onMenu={() => setSidebarOpen(true)}
              onSignIn={() => setAuthOpen(true)}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
          </div>
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Create merchant page files**

Each page imports the corresponding view component:

`src/app/(dashboard)/merchant/dashboard/page.tsx`:
```tsx
"use client";
import DashboardView from "@/components/cc/views/DashboardView";
export default function Page() { return <DashboardView />; }
```

`src/app/(dashboard)/merchant/products/page.tsx`:
```tsx
"use client";
import ProductsView from "@/components/cc/views/ProductsView";
export default function Page() { return <ProductsView />; }
```

`src/app/(dashboard)/merchant/orders/page.tsx`:
```tsx
"use client";
import OrdersView from "@/components/cc/views/OrdersView";
export default function Page() { return <OrdersView />; }
```

`src/app/(dashboard)/merchant/inventory/page.tsx`:
```tsx
"use client";
import InventoryView from "@/components/cc/views/InventoryView";
export default function Page() { return <InventoryView />; }
```

`src/app/(dashboard)/merchant/customers/page.tsx`:
```tsx
"use client";
import CustomersView from "@/components/cc/views/CustomersView";
export default function Page() { return <CustomersView />; }
```

`src/app/(dashboard)/merchant/storefront/page.tsx`:
```tsx
"use client";
import StorefrontView from "@/components/cc/views/StorefrontView";
export default function Page() { return <StorefrontView />; }
```

`src/app/(dashboard)/merchant/settings/page.tsx`:
```tsx
"use client";
import SettingsView from "@/components/cc/views/SettingsView";
export default function Page() { return <SettingsView />; }
```

`src/app/(dashboard)/admin/settings/page.tsx`:
```tsx
"use client";
import SettingsView from "@/components/cc/views/SettingsView";
export default function Page() { return <SettingsView />; }
```

- [ ] **Step 3: Update `src/app/(dashboard)/admin/page.tsx`**

Replace the placeholder with AdminView:

```tsx
"use client";
import AdminView from "@/components/cc/views/AdminView";
export default function Page() { return <AdminView />; }
```

- [ ] **Step 4: Delete `src/app/(dashboard)/merchant/page.tsx`**

```bash
rm src/app/(dashboard)/merchant/page.tsx
```

---

### Task 7: Verify Build

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

The build should complete without errors. Navigate to:
- `/merchant/dashboard` — should show the dashboard with charts and stats
- `/merchant/products` — should show product grid
- `/merchant/orders` — should show orders table
- `/merchant/inventory` — should show inventory with live updates
- `/merchant/customers` — should show customer cards
- `/merchant/storefront` — should show storefront with cart
- `/merchant/settings` — should show settings page
- `/admin` — should show admin view with merchants table
- `/admin/settings` — should show settings page
- `/` — should still show the marketing landing page

- [ ] **Step 2: Fix any build errors**

Read error output and fix accordingly.
