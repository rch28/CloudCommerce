---
status: awaiting_human_verify
trigger: "search is not working on inventory page at http://localhost:3000/merchant/inventory"
created: 2026-06-21T12:00:00Z
updated: 2026-06-21T12:15:00Z
---

## Current Focus

hypothesis: Root cause identified — ALL issues fixed
test: Applied 3 fixes, need browser verification
expecting: Single search input "Search by product name or SKU..." triggers API calls to /api/v1/inventory?search=... on each keystroke
next_action: Verify in browser

## Symptoms

expected: Typing in search input should trigger an API call to /api/v1/inventory with search query param
actual: No API call made when typing; search completely non-functional
errors: (none reported)
reproduction: Open /merchant/inventory, type in search input, observe no network requests
started: Multiple fix attempts over several commits

## Eliminated

(9 hypotheses eliminated - see prior entries)

## Evidence

(9 evidence entries - see prior entries)

## Resolution

root_cause: Three root issues were found:
  **Issue 1 — Dead search input (most likely cause):** DataTable component has `searchable={true}` by default. The old code explicitly passed `searchable` and `searchKeys` props. When these were removed in the search refactor, the DataTable still renders its own search input (placeholder "Search...") that does CLIENT-SIDE filtering. Since `searchKeys` is now undefined, the filtering condition `if (search && searchKeys)` is always false — the DataTable search silently does NOTHING. The user types in this dead input and no API call is made, nor any client-side filtering occurs.

  **Issue 2 — Effect not triggered by search state:** The `useEffect` depended only on `[filter]`. When `onSearchChange` called `setSearchQuery` + `fetchItems` directly, the effect wouldn't catch it. If the React Compiler or another optimization interfered with the direct call, there was no fallback. The safer pattern is to let the useEffect (which React guarantees will execute correctly) handle ALL data fetching.

  **Issue 3 — Invalid Prisma query syntax:** The `lowStock` filter used `prisma.inventory.fields.lowStockThreshold` which is not valid Prisma syntax (Prisma has no `.fields` property). This would throw a TypeError if the user clicked the "Low Stock" filter tab. Fixed by filtering in-memory after the query.

fix: Three changes applied:
  1. Added `searchable={false}` to DataTable to remove the dead built-in search input
  2. Changed useEffect deps from `[filter]` to `[filter, searchQuery]` and simplified `onSearchChange` to only set state (the effect handles fetching)
  3. Fixed invalid Prisma `lowStock` query, and added `mode: "insensitive"` to search for case-insensitive matching on PostgreSQL

verification: Pending user verification in browser
files_changed: ["src/components/cc/views/InventoryView.tsx", "src/lib/services/inventory.ts"]
