import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import type { UploadProvider, UploadedFile } from "./types";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export class LocalUploadProvider implements UploadProvider {
  async upload(file: File, path?: string): Promise<UploadedFile> {
    const dir = path ? join(UPLOAD_DIR, path) : UPLOAD_DIR;
    await mkdir(dir, { recursive: true });

    const ext = file.name.split(".").pop() || "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = join(dir, filename);

    await writeFile(filepath, buffer);

    return {
      url: `/uploads/${path ? `${path}/` : ""}${filename}`,
      filename,
      mimeType: file.type,
      size: buffer.length,
    };
  }

  async delete(url: string): Promise<void> {
    const filepath = join(process.cwd(), "public", url);
    await unlink(filepath).catch(() => {});
  }
}
