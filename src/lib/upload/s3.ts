import type { UploadProvider, UploadedFile } from "./types";

export class S3UploadProvider implements UploadProvider {
  async upload(_file: File, _path?: string): Promise<UploadedFile> {
    throw new Error("S3 adapter not configured. Set S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY env vars.");
  }

  async delete(_url: string): Promise<void> {
    throw new Error("S3 adapter not configured.");
  }
}
