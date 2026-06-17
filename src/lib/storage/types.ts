export interface UploadedFile {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  thumbnails?: Record<string, string>;
}

export interface UploadOptions {
  path?: string;
  tenantId: string;
  generateThumbnails?: boolean;
  allowedMimeTypes?: string[];
  maxSize?: number;
}

export interface SignedUploadUrl {
  url: string;
  fields?: Record<string, string>;
  fileId: string;
  expiresAt: number;
}

export interface StorageProvider {
  upload(file: File, options: UploadOptions): Promise<UploadedFile>;
  uploadBuffer(buffer: Buffer, filename: string, mimeType: string, options: UploadOptions): Promise<UploadedFile>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  getSignedUploadUrl(filename: string, mimeType: string, options: UploadOptions): Promise<SignedUploadUrl>;
}
