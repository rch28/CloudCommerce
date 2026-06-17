import sharp from "sharp";

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

export interface ThumbnailSet {
  small: Buffer;
  medium: Buffer;
  large: Buffer;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 },
};

export function validateImage(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Invalid file extension: .${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB`);
  }
}

export function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  return map[mimeType] || "bin";
}

export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const optimized = await image
    .rotate()
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  const result = await sharp(optimized).metadata();
  return {
    buffer: optimized,
    width: result.width || 0,
    height: result.height || 0,
    format: "webp",
  };
}

export async function generateThumbnails(buffer: Buffer): Promise<ThumbnailSet> {
  const [small, medium, large] = await Promise.all(
    (["small", "medium", "large"] as const).map(async (size) => {
      const cfg = THUMBNAIL_SIZES[size];
      return sharp(buffer)
        .rotate()
        .resize(cfg.width, cfg.height, { fit: "cover", position: "centre" })
        .webp({ quality: 75, effort: 3 })
        .toBuffer();
    })
  );
  return { small, medium, large };
}

export async function generateResponsiveSizes(buffer: Buffer): Promise<{ width: number; height: number; buffer: Buffer }[]> {
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 1200;
  const breakpoints = [640, 768, 1024, 1280, originalWidth].filter((w) => w <= originalWidth);
  return Promise.all(
    breakpoints.map(async (width) => {
      const resized = await sharp(buffer).rotate().resize(width).webp({ quality: 80, effort: 4 }).toBuffer();
      return { width, height: Math.round(width * ((metadata.height || 1) / originalWidth)), buffer: resized };
    })
  );
}

export const IMAGE_CONFIG = {
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  allowedExtensions: ALLOWED_EXTENSIONS,
  maxFileSize: MAX_FILE_SIZE,
  thumbnailSizes: THUMBNAIL_SIZES,
};
