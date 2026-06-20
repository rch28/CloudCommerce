"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon } from "lucide-react";

interface ImageBlockProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, styles?: Record<string, unknown>) => void;
}

export default function ImageBlock({ content, onChange }: ImageBlockProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <ImageIcon size={16} /> Image Section
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Image URL</Label>
            <Input
              value={(content.src as string) || ""}
              onChange={(e) => onChange({ ...content, src: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Alt Text</Label>
            <Input
              value={(content.alt as string) || ""}
              onChange={(e) => onChange({ ...content, alt: e.target.value })}
              placeholder="Image description"
            />
          </div>
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Caption</Label>
            <Input
              value={(content.caption as string) || ""}
              onChange={(e) => onChange({ ...content, caption: e.target.value })}
              placeholder="Optional caption"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Preview</p>
        <div className="overflow-hidden rounded-lg bg-slate-800/50">
          {(content.src as string) ? (
            <img src={content.src as string} alt={(content.alt as string) || ""} className="max-h-48 w-full object-cover" />
          ) : (
            <div className="flex h-32 items-center justify-center text-slate-500"><ImageIcon size={32} /></div>
          )}
          {(content.caption as string) && (
            <p className="p-2 text-center text-xs text-slate-400">{content.caption as string}</p>
          )}
        </div>
      </div>
    </div>
  );
}
