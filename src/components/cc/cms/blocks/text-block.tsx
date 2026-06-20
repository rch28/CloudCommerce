"use client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Type } from "lucide-react";

interface TextBlockProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, styles?: Record<string, unknown>) => void;
}

export default function TextBlock({ content, onChange }: TextBlockProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <Type size={16} /> Text Section
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label variant="muted" size="sm">Content (HTML)</Label>
            <Textarea
              value={(content.body as string) || ""}
              onChange={(e) => onChange({ ...content, body: e.target.value })}
              placeholder="Write your content here... Supports basic HTML."
              className="min-h-[150px]"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Preview</p>
        <div className="prose prose-invert prose-sm max-w-none rounded-lg bg-slate-800/50 p-4">
          <div dangerouslySetInnerHTML={{ __html: (content.body as string) || "<p>Your text content will appear here.</p>" }} />
        </div>
      </div>
    </div>
  );
}
