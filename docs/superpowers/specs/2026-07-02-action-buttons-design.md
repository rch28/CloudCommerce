# ActionButtons Component

## Purpose
Replace all inline action button groups in table views with a single reusable `ActionButtons` component that includes tooltips and consistent styling.

## API

```tsx
type ActionType =
  | "edit"      // Pencil, hover:text-[#F8FAFC]
  | "view"      // Eye, hover:text-blue-400
  | "delete"    // Trash2, hover:text-rose-400
  | "copy"      // Copy, hover:text-cyan-400
  | "archive"   // Archive, hover:text-amber-400
  | "restore"   // RotateCcw, hover:text-emerald-400
  | "publish"   // Globe, hover:text-emerald-400
  | "unpublish" // Globe, hover:text-amber-400
  | "preview"   // Eye, hover:text-blue-400
  | "history"   // History, hover:text-[#F8FAFC]
  | "adjust";   // RotateCcw, hover:text-[#F8FAFC]

interface ActionButtonConfig {
  type: ActionType;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface ActionButtonsProps {
  actions: ActionButtonConfig[];
}
```

## Rendering
- Each action renders as `<Tooltip><TooltipTrigger><button><TooltipContent>`.
- Button styling: `rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B]`
- Hover text colors mapped per action type.
- Loading state shows `Loader2` spinner.
- Actions render in a flex row with `justify-end` and `gap-1`.

## Files to Modify
1. Create: `src/components/ui/action-buttons.tsx`
2. Update: ProductsView, CategoriesView, CMSView, InventoryView, WarehousesView, LoyaltyView, SettingsView, PromotionsView
