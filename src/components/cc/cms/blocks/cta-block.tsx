"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MousePointerClick } from "lucide-react";

interface CtaBlockProps {
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, styles?: Record<string, unknown>) => void;
}

export default function CtaBlock({ content, styles, onChange }: CtaBlockProps) {
  const alignment = (content.alignment as string) || "center";

  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value }, styles);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <MousePointerClick size={16} /> Call to Action Section
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Title</Label>
            <Input
              value={(content.title as string) || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ready to get started?"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Description</Label>
            <Textarea
              value={(content.description as string) || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional description text"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Button Text</Label>
            <Input
              value={(content.buttonText as string) || ""}
              onChange={(e) => update("buttonText", e.target.value)}
              placeholder="Get Started"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Button Link</Label>
            <Input
              value={(content.buttonLink as string) || ""}
              onChange={(e) => update("buttonLink", e.target.value)}
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
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Preview</p>
        <div
          className="rounded-lg bg-slate-800/50 p-6"
          style={{ textAlign: alignment as "left" | "center" | "right" }}
        >
          <h3 className="text-lg font-bold text-[#F8FAFC]">{(content.title as string) || "Call to Action"}</h3>
          {(content.description as string) && (
            <p className="mt-1 text-sm text-slate-400">{content.description as string}</p>
          )}
          <span className="mt-3 inline-block rounded-lg bg-[#7C3AED] px-5 py-2 text-sm font-medium text-white">
            {(content.buttonText as string) || "Button"}
          </span>
        </div>
      </div>
    </div>
  );
}
