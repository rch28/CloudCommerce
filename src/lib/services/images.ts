import { prisma } from "@/lib/prisma";

interface ImageRecord {
  id: string; productId: string; url: string; alt: string | null; sortOrder: number; createdAt: Date;
}

const mockImages: ImageRecord[] = [];

export async function listProductImages(productId: string): Promise<ImageRecord[]> {
  if (process.env.DATABASE_URL) {
    return prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } }) as unknown as ImageRecord[];
  }
  return mockImages.filter((i) => i.productId === productId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createImage(productId: string, url: string, alt?: string, sortOrder = 0): Promise<ImageRecord> {
  if (process.env.DATABASE_URL) {
    return prisma.productImage.create({ data: { productId, url, alt: alt ?? null, sortOrder } }) as unknown as ImageRecord;
  }
  const record: ImageRecord = { id: `img-${Date.now()}`, productId, url, alt: alt ?? null, sortOrder, createdAt: new Date() };
  mockImages.push(record);
  return record;
}

export async function deleteImage(id: string): Promise<void> {
  if (process.env.DATABASE_URL) {
    await prisma.productImage.delete({ where: { id } });
    return;
  }
  const idx = mockImages.findIndex((i) => i.id === id);
  if (idx >= 0) mockImages.splice(idx, 1);
}

export async function reorderImages(productId: string, imageIds: string[]): Promise<void> {
  if (process.env.DATABASE_URL) {
    for (let i = 0; i < imageIds.length; i++) {
      await prisma.productImage.update({ where: { id: imageIds[i] }, data: { sortOrder: i } });
    }
    return;
  }
  imageIds.forEach((id, i) => {
    const img = mockImages.find((m) => m.id === id);
    if (img) img.sortOrder = i;
  });
}
