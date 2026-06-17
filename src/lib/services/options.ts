import { prisma } from "@/lib/prisma";

interface OptionRecord {
  id: string; productId: string; name: string; sortOrder: number; createdAt: Date;
  values?: OptionValueRecord[];
}

interface OptionValueRecord {
  id: string; optionId: string; variantId: string | null; label: string; value: string; sortOrder: number;
}

const mockOptions: OptionRecord[] = [];
const mockValues: OptionValueRecord[] = [];

export async function listProductOptions(productId: string): Promise<OptionRecord[]> {
  if (process.env.DATABASE_URL) {
    return prisma.productOption.findMany({
      where: { productId },
      include: { values: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }) as unknown as OptionRecord[];
  }
  return mockOptions
    .filter((o) => o.productId === productId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((o) => ({ ...o, values: mockValues.filter((v) => v.optionId === o.id).sort((a, b) => a.sortOrder - b.sortOrder) }));
}

export async function createOption(productId: string, name: string, sortOrder = 0): Promise<OptionRecord> {
  if (process.env.DATABASE_URL) {
    return prisma.productOption.create({ data: { productId, name, sortOrder } }) as unknown as OptionRecord;
  }
  const record: OptionRecord = { id: `opt-${Date.now()}`, productId, name, sortOrder, createdAt: new Date() };
  mockOptions.push(record);
  return record;
}

export async function deleteOption(id: string): Promise<void> {
  if (process.env.DATABASE_URL) {
    await prisma.productOption.delete({ where: { id } });
    return;
  }
  const idx = mockOptions.findIndex((o) => o.id === id);
  if (idx >= 0) { mockOptions.splice(idx, 1); }
  for (let i = mockValues.length - 1; i >= 0; i--) {
    if (mockValues[i].optionId === id) mockValues.splice(i, 1);
  }
}

export async function createOptionValue(optionId: string, label: string, value: string, variantId?: string, sortOrder = 0): Promise<OptionValueRecord> {
  if (process.env.DATABASE_URL) {
    return prisma.productOptionValue.create({ data: { optionId, label, value, variantId: variantId ?? null, sortOrder } }) as unknown as OptionValueRecord;
  }
  const record: OptionValueRecord = { id: `ov-${Date.now()}`, optionId, variantId: variantId ?? null, label, value, sortOrder };
  mockValues.push(record);
  return record;
}
