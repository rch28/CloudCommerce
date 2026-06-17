"use client";
import { useState } from "react";
import { GripVertical, Star, Trash2, Loader2, ImageIcon } from "lucide-react";

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
  thumbnails?: Record<string, string>;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  onReorder: (images: GalleryImage[]) => void;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  readonly?: boolean;
}

export default function ImageGallery({ images, onReorder, onSetPrimary, onRemove, readonly = false }: ImageGalleryProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleDragStart = (index: number) => {
    if (readonly) return;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index || readonly) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    const updated = reordered.map((img, i) => ({ ...img, sortOrder: i }));
    onReorder(updated);
    setDragIndex(index);
  };

  const handleDragEnd = () => setDragIndex(null);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      const image = sorted.find((img) => img.id === id);
      if (image) {
        await fetch("/api/v1/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: image.url }),
        });
      }
      onRemove(id);
    } catch { /* ignore */ }
    setRemoving(null);
  };

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-4 py-10 text-center">
        <ImageIcon size={28} className="text-muted-foreground/30" />
        <p className="mt-2 text-sm text-muted-foreground">No images uploaded</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {sorted.map((image, index) => (
        <div
          key={image.id}
          draggable={!readonly}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`group relative aspect-square overflow-hidden rounded-lg border bg-[#1E293B] transition-all ${
            dragIndex === index ? "opacity-50 scale-95" : ""
          } ${image.isPrimary ? "ring-2 ring-[#7C3AED]" : "border-border"}`}
        >
          <img
            src={image.thumbnails?.medium || image.url}
            alt={image.alt ?? ""}
            className="h-full w-full object-cover"
          />

          {/* Primary badge */}
          {image.isPrimary && (
            <div className="absolute left-1.5 top-1.5 rounded-md bg-[#7C3AED] px-1.5 py-0.5 text-[10px] font-medium text-white shadow-lg">
              Primary
            </div>
          )}

          {!readonly && (
            <div className="absolute inset-0 flex items-end justify-center gap-1 bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              {/* Drag handle */}
              <div className="rounded-lg bg-black/60 p-1.5 text-white/70 transition-colors hover:text-white cursor-grab active:cursor-grabbing">
                <GripVertical size={13} />
              </div>

              {/* Set primary */}
              {!image.isPrimary && (
                <button
                  onClick={() => onSetPrimary(image.id)}
                  className="rounded-lg bg-black/60 p-1.5 text-white/70 transition-colors hover:text-amber-400"
                  title="Set as primary"
                >
                  <Star size={13} />
                </button>
              )}

              {/* Remove */}
              <button
                onClick={() => handleRemove(image.id)}
                disabled={removing === image.id}
                className="rounded-lg bg-black/60 p-1.5 text-white/70 transition-colors hover:text-rose-400 disabled:opacity-50"
                title="Remove image"
              >
                {removing === image.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
