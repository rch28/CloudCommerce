import { writeFile, mkdir, unlink } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";
import { v4 as uuid } from "uuid";
import type { StorageProvider, UploadedFile, UploadOptions, SignedUploadUrl } from "./types";
import { validateImage, processImage, generateThumbnails, getFileExtension } from "@/lib/image";

const UPLOAD_ROOT = join(process.cwd(), "public", "uploads");

export class LocalStorageProvider implements StorageProvider {
  private getTenantDir(tenantId: string): string {
    return join(UPLOAD_ROOT, tenantId);
  }

  private getPhysicalPath(tenantId: string, subPath: string): string {
    return join(this.getTenantDir(tenantId), subPath);
  }

  private getPublicPath(tenantId: string, subPath: string): string {
    return `/uploads/${tenantId}/${subPath}`;
  }

  async upload(file: File, options: UploadOptions): Promise<UploadedFile> {
    validateImage(file);
    const tenantDir = this.getTenantDir(options.tenantId);
    const subPath = options.path || "products";
    const dir = join(tenantDir, subPath);
    await mkdir(dir, { recursive: true });

    const ext = getFileExtension(file.type);
    const fileId = uuid();
    const filename = `${fileId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process and optimize
    const processed = await processImage(buffer);
    const filepath = join(dir, filename);
    await writeFile(filepath, processed.buffer);
    await writeFile(join(dir, `${fileId}.original.${ext}`), buffer);

    // Thumbnails
    const thumbnails: Record<string, string> = {};
    if (options.generateThumbnails !== false) {
      const thumbs = await generateThumbnails(processed.buffer);
      await mkdir(join(dir, `${fileId}_thumbs`), { recursive: true });
      for (const [size, buf] of Object.entries(thumbs)) {
        const thumbPath = join(dir, `${fileId}_thumbs`, `${size}.webp`);
        await writeFile(thumbPath, buf);
        thumbnails[size] = this.getPublicPath(options.tenantId, `${subPath}/${fileId}_thumbs/${size}.webp`);
      }
    }

    return {
      url: this.getPublicPath(options.tenantId, `${subPath}/${filename}`),
      filename,
      originalName: file.name,
      mimeType: "image/webp",
      size: processed.buffer.length,
      width: processed.width,
      height: processed.height,
      thumbnails: Object.keys(thumbnails).length > 0 ? thumbnails : undefined,
    };
  }

  async uploadBuffer(buffer: Buffer, filename: string, mimeType: string, options: UploadOptions): Promise<UploadedFile> {
    const tenantDir = this.getTenantDir(options.tenantId);
    const subPath = options.path || "products";
    const dir = join(tenantDir, subPath);
    await mkdir(dir, { recursive: true });

    const ext = getFileExtension(mimeType);
    const fileId = uuid();
    const name = `${fileId}.${ext}`;

    const processed = await processImage(buffer);
    const filepath = join(dir, name);
    await writeFile(filepath, processed.buffer);

    return {
      url: this.getPublicPath(options.tenantId, `${subPath}/${name}`),
      filename: name,
      originalName: filename,
      mimeType: "image/webp",
      size: processed.buffer.length,
      width: processed.width,
      height: processed.height,
    };
  }

  async delete(key: string): Promise<void> {
    const filepath = join(process.cwd(), "public", key);
    await unlink(filepath).catch(() => {});

    // Clean up thumbnails directory
    const parsed = extname(key);
    const basePath = key.replace(parsed, "");
    const thumbDir = join(process.cwd(), "public", `${basePath}_thumbs`);
    if (existsSync(thumbDir)) {
      await unlink(thumbDir).catch(() => {});
    }

    // Clean up original
    const origPath = filepath.replace(parsed, `.original${parsed}`);
    await unlink(origPath).catch(() => {});
  }

  getUrl(key: string): string {
    return key.startsWith("/uploads/") ? key : `/uploads/${key}`;
  }

  async getSignedUploadUrl(_filename: string, _mimeType: string, _options: UploadOptions): Promise<SignedUploadUrl> {
    const fileId = uuid();
    return { url: `/api/v1/upload`, fields: { fileId }, fileId, expiresAt: Date.now() + 3600000 };
  }
}
