import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";
import { R2StorageProvider } from "./r2";

export type { StorageProvider, UploadedFile, UploadOptions, SignedUploadUrl } from "./types";

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!provider) {
    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY) {
      provider = new R2StorageProvider();
    } else if (process.env.S3_BUCKET) {
      provider = new S3StorageProvider();
    } else {
      provider = new LocalStorageProvider();
    }
  }
  return provider;
}

export function resetStorageProvider(): void {
  provider = null;
}
