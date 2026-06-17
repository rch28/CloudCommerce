"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, X, FileImage, Loader2, AlertCircle, Check } from "lucide-react";

export interface UploadedImage {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  thumbnails?: Record<string, string>;
}

interface UploadDropzoneProps {
  onUpload: (image: UploadedImage) => void;
  path?: string;
  maxSize?: number;
  accept?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

export default function UploadDropzone({ onUpload, path = "products", maxSize = DEFAULT_MAX_SIZE, accept = ".jpg,.jpeg,.png,.webp" }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    setSuccess(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Invalid file type: ${file.type.split("/")[1]}. Use JPG, PNG, or WebP.`);
      return;
    }
    if (file.size > maxSize) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${Math.floor(maxSize / 1024 / 1024)}MB.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);

      const res = await fetch("/api/v1/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const result: UploadedImage = await res.json();
      setSuccess(`${file.name} uploaded successfully`);
      onUpload(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUpload, path, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [handleUpload]);

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragging
            ? "border-[#7C3AED] bg-[#7C3AED]/10"
            : "border-border hover:border-[#7C3AED]/50 hover:bg-[#1E293B]/50"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={28} className="animate-spin text-[#7C3AED]" />
            <p className="text-sm text-muted-foreground">Uploading and optimizing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10">
              <Upload size={22} className="text-[#7C3AED]" />
            </div>
            <p className="text-sm font-medium text-[#F8FAFC]">
              {dragging ? "Drop to upload" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or WebP up to {Math.floor(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          <AlertCircle size={13} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          <Check size={13} />
          {success}
        </div>
      )}
    </div>
  );
}
