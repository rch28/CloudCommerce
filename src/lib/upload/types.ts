export interface UploadedFile {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface UploadProvider {
  upload(file: File, path?: string): Promise<UploadedFile>;
  delete(url: string): Promise<void>;
}
