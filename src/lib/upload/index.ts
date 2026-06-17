import type { UploadProvider } from "./types";
import { LocalUploadProvider } from "./local";
import { S3UploadProvider } from "./s3";

let provider: UploadProvider | null = null;

export function getUploadProvider(): UploadProvider {
  if (!provider) {
    const useS3 = process.env.S3_BUCKET && process.env.S3_REGION;
    provider = useS3 ? new S3UploadProvider() : new LocalUploadProvider();
  }
  return provider;
}
