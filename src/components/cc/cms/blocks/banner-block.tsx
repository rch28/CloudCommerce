"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone } from "lucide-react";

interface BannerBlockProps {
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, styles?: Record<string, unknown>) => void;
}

export default function BannerBlock({ content, styles, onChange }: BannerBlockProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <Megaphone size={16} /> Banner Section
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Message</Label>
            <Textarea
              value={(content.message as string) || ""}
              onChange={(e) => onChange({ ...content, message: e.target.value }, styles)}
              placeholder="Free shipping on orders over $100!"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Link URL</Label>
            <Input
              value={(content.linkUrl as string) || ""}
              onChange={(e) => onChange({ ...content, linkUrl: e.target.value }, styles)}
              placeholder="/products"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Link Text</Label>
            <Input
              value={(content.linkText as string) || ""}
              onChange={(e) => onChange({ ...content, linkText: e.target.value }, styles)}
              placeholder="Shop Now"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label variant="muted" size="sm">Background Color</Label>
              <Input
                value={(styles?.bgColor as string) || "#7C3AED"}
                onChange={(e) => onChange(content, { ...styles, bgColor: e.target.value })}
                placeholder="#7C3AED"
              />
            </div>
            <div className="space-y-1.5">
              <Label variant="muted" size="sm">Text Color</Label>
              <Input
                value={(styles?.textColor as string) || "#FFFFFF"}
                onChange={(e) => onChange(content, { ...styles, textColor: e.target.value })}
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Preview</p>
        <div
          className="rounded-lg p-4 text-center text-sm"
          style={{
            backgroundColor: (styles?.bgColor as string) || "#7C3AED",
            color: (styles?.textColor as string) || "#FFFFFF",
          }}
        >
          {(content.message as string) || "Banner message"}
          {(content.linkText as string) && (
            <span className="ml-2 underline">{(content.linkText as string)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
