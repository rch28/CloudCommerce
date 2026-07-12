"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Image } from "lucide-react";

interface HeroBlockProps {
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, styles?: Record<string, unknown>) => void;
}

export default function HeroBlock({ content, styles, onChange }: HeroBlockProps) {
  const [showBg, setShowBg] = useState(!!content.backgroundImage);
  const alignment = (content.alignment as string) || "left";

  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value }, styles);
  const updateStyle = (key: string, value: unknown) => onChange(content, { ...styles, [key]: value });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/50 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Image size={16} /> Hero Section
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Title</Label>
            <Input
              value={(content.title as string) || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Hero title..."
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Subtitle</Label>
            <Textarea
              value={(content.subtitle as string) || ""}
              onChange={(e) => update("subtitle", e.target.value)}
              placeholder="Hero subtitle..."
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">CTA Text</Label>
            <Input
              value={(content.ctaText as string) || ""}
              onChange={(e) => update("ctaText", e.target.value)}
              placeholder="Button text..."
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">CTA Link</Label>
            <Input
              value={(content.ctaLink as string) || ""}
              onChange={(e) => update("ctaLink", e.target.value)}
              placeholder="/products"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Alignment</Label>
            <Select value={alignment} onValueChange={(v) => update("alignment", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showBg}
              onChange={(e) => { setShowBg(e.target.checked); if (!e.target.checked) update("backgroundImage", null); }}
              className="h-4 w-4 rounded border-border accent-[#7C3AED]"
            />
            <Label variant="muted" size="sm">Background Image</Label>
          </div>
          {showBg && (
            <div className="space-y-1.5">
              <Input
                value={(content.backgroundImage as string) || ""}
                onChange={(e) => update("backgroundImage", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Preview</p>
        <div
          className="flex min-h-[120px] items-center rounded-lg bg-muted/50 p-4"
          style={{
            textAlign: alignment as any,
            ...(content.backgroundImage ? { backgroundImage: `url(${content.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
          }}
        >
          <div className={alignment === "center" ? "mx-auto" : alignment === "right" ? "ml-auto" : ""}>
            <h3 className="text-lg font-bold text-foreground">{((content.title as string) || "Hero Title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{((content.subtitle as string) || "Subtitle text")}</p>
            {(content.ctaText as string) && (
              <span className="mt-2 inline-block rounded-lg bg-[#7C3AED] px-4 py-1.5 text-xs font-medium text-white">
                {(content.ctaText as string)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
