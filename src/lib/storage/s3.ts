import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import type { StorageProvider, UploadedFile, UploadOptions, SignedUploadUrl } from "./types";
import { validateImage, processImage, generateThumbnails, getFileExtension } from "@/lib/image";

function getS3Client(): S3Client {
  const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
  const endpoint = process.env.S3_ENDPOINT;
  const config: any = { region };
  if (process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
    config.credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    };
  }
  if (endpoint) config.endpoint = endpoint;
  if (process.env.S3_FORCE_PATH_STYLE === "true") config.forcePathStyle = true;
  return new S3Client(config);
}

function getBucket(): string {
  return process.env.S3_BUCKET || "cloud-commerce";
}

function getPublicUrlBase(): string {
  return process.env.S3_PUBLIC_URL || `https://${getBucket()}.s3.amazonaws.com`;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrlBase: string;

  constructor() {
    this.client = getS3Client();
    this.bucket = getBucket();
    this.publicUrlBase = getPublicUrlBase();
  }

  private getKey(tenantId: string, subPath: string, filename: string): string {
    return `${tenantId}/${subPath}/${filename}`;
  }

  private getPublicUrl(key: string): string {
    return `${this.publicUrlBase}/${key}`;
  }

  async upload(file: File, options: UploadOptions): Promise<UploadedFile> {
    validateImage(file);
    const subPath = options.path || "products";
    const ext = getFileExtension(file.type);
    const fileId = uuid();
    const filename = `${fileId}.${ext}`;
    const key = this.getKey(options.tenantId, subPath, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(buffer);

    // Upload optimized image
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: processed.buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    // Upload original
    const origKey = this.getKey(options.tenantId, subPath, `${fileId}.original.${ext}`);
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket, Key: origKey, Body: buffer,
      ContentType: file.type, CacheControl: "public, max-age=31536000, immutable",
    }));

    // Thumbnails
    const thumbnails: Record<string, string> = {};
    if (options.generateThumbnails !== false) {
      const thumbs = await generateThumbnails(processed.buffer);
      for (const [size, buf] of Object.entries(thumbs)) {
        const thumbKey = this.getKey(options.tenantId, subPath, `${fileId}_thumbs/${size}.webp`);
        await this.client.send(new PutObjectCommand({
          Bucket: this.bucket, Key: thumbKey, Body: buf,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }));
        thumbnails[size] = this.getPublicUrl(thumbKey);
      }
    }

    return {
      url: this.getPublicUrl(key),
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
    const subPath = options.path || "products";
    const ext = getFileExtension(mimeType);
    const fileId = uuid();
    const name = `${fileId}.${ext}`;
    const key = this.getKey(options.tenantId, subPath, name);

    const processed = await processImage(buffer);
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: processed.buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    return {
      url: this.getPublicUrl(key), filename: name, originalName: filename,
      mimeType: "image/webp", size: processed.buffer.length,
      width: processed.width, height: processed.height,
    };
  }

  async delete(key: string): Promise<void> {
    const s3Key = key.replace(this.publicUrlBase + "/", "");
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: s3Key })).catch(() => {});

    // Clean up thumbnails
    const parsed = s3Key.replace(/\.[^.]+$/, "");
    for (const size of ["small", "medium", "large"]) {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket, Key: `${parsed}_thumbs/${size}.webp`,
      })).catch(() => {});
    }
    // Clean up original
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket, Key: s3Key.replace(/\.\w+$/, ".original$&"),
    })).catch(() => {});
  }

  getUrl(key: string): string {
    if (key.startsWith("http")) return key;
    return this.getPublicUrl(key);
  }

  async getSignedUploadUrl(filename: string, mimeType: string, options: UploadOptions): Promise<SignedUploadUrl> {
    const ext = getFileExtension(mimeType);
    const fileId = uuid();
    const name = `${fileId}.${ext}`;
    const key = this.getKey(options.tenantId, options.path || "products", name);

    const command = new PutObjectCommand({
      Bucket: this.bucket, Key: key,
      ContentType: "image/webp",
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });

    return { url, fileId, expiresAt: Date.now() + 3600000 };
  }
}
