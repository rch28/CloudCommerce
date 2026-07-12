"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Grid } from "lucide-react";

interface ProductGridBlockProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, styles?: Record<string, unknown>) => void;
}

export default function ProductGridBlock({ content, onChange }: ProductGridBlockProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/50 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Grid size={16} /> Product Grid Section
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Title</Label>
            <Input
              value={(content.title as string) || ""}
              onChange={(e) => onChange({ ...content, title: e.target.value })}
              placeholder="Featured Products"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Product IDs (comma separated)</Label>
            <Input
              value={(content.productIds as string) || ""}
              onChange={(e) => onChange({ ...content, productIds: e.target.value })}
              placeholder="prod-1, prod-2, prod-3"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Category Filter</Label>
            <Input
              value={(content.categoryId as string) || ""}
              onChange={(e) => onChange({ ...content, categoryId: e.target.value })}
              placeholder="cat-1 (optional)"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Max Products</Label>
            <Input
              type="number"
              value={(content.limit as number) ?? 8}
              onChange={(e) => onChange({ ...content, limit: parseInt(e.target.value) || 8 })}
              min={1}
              max={50}
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Preview</p>
        <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          Product grid will render here with {(content.limit as number) || 8} products
          {(content.title as string) ? ` — "${content.title}"` : ""}
        </div>
      </div>
    </div>
  );
}
