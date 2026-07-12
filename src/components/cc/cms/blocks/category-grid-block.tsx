"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";

interface CategoryGridBlockProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, styles?: Record<string, unknown>) => void;
}

export default function CategoryGridBlock({ content, onChange }: CategoryGridBlockProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/50 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Tag size={16} /> Category Grid Section
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Title</Label>
            <Input
              value={(content.title as string) || ""}
              onChange={(e) => onChange({ ...content, title: e.target.value })}
              placeholder="Shop by Category"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Category IDs (comma separated)</Label>
            <Input
              value={(content.categoryIds as string) || ""}
              onChange={(e) => onChange({ ...content, categoryIds: e.target.value })}
              placeholder="cat-1, cat-2, cat-3"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Max Categories</Label>
            <Input
              type="number"
              value={(content.limit as number) ?? 6}
              onChange={(e) => onChange({ ...content, limit: parseInt(e.target.value) || 6 })}
              min={1}
              max={20}
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Preview</p>
        <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          Category grid will render here with {(content.limit as number) || 6} categories
        </div>
      </div>
    </div>
  );
}
