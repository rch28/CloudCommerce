import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";

interface OptionRecord {
  id: string; productId: string; name: string; sortOrder: number; createdAt: Date;
  values?: OptionValueRecord[];
}

interface OptionValueRecord {
  id: string; optionId: string; variantId: string | null; label: string; value: string; sortOrder: number;
}

interface VariantRecord {
  id: string; productId: string; sku: string; price: number;
  quantity: number; isDefault: boolean; status: string;
  deletedAt: Date | null; createdAt: Date; updatedAt: Date;
}

const mockOptions: OptionRecord[] = [];
const mockValues: OptionValueRecord[] = [];
const mockGeneratedVariants: VariantRecord[] = [];

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

export interface VariantGenerationResult {
  variant: VariantRecord;
  label: string;
}

export async function generateVariants(
  productId: string,
  options: { name: string; values: string[] }[],
  basePrice: number,
  baseSku: string
): Promise<VariantGenerationResult[]> {
  const combinations = cartesianProduct(options.map((o) => o.values));
  const results: VariantGenerationResult[] = [];

  for (let i = 0; i < combinations.length; i++) {
    const combo = combinations[i];
    const label = combo.join(" / ");
    const sku = `${baseSku}-${combo.map((v) => v.toUpperCase().replace(/\s+/g, "")).join("-")}`;
    const isDefault = i === 0;

    let variant: VariantRecord;

    if (process.env.DATABASE_URL) {
      const created = await prisma.productVariant.create({
        data: {
          productId, sku, price: basePrice,
          quantity: 0, isDefault, status: "active",
        },
      });

      // Create option value links
      for (let oi = 0; oi < options.length; oi++) {
        const optRecord = await prisma.productOption.findFirst({
          where: { productId, name: options[oi].name },
        });
        if (optRecord) {
          const valRecord = await prisma.productOptionValue.findFirst({
            where: { optionId: optRecord.id, value: combo[oi] },
          });
          if (valRecord) {
            await prisma.productOptionValue.update({
              where: { id: valRecord.id },
              data: { variantId: created.id },
            });
          }
        }
      }

      // Create inventory record
      await prisma.inventory.create({
        data: {
          variantId: created.id,
          quantity: 0, reserved: 0,
          lowStockThreshold: 10, reorderLevel: 5,
          tenantId: productId, // fallback; real tenant comes from meta
        },
      });

      variant = created as unknown as VariantRecord;
    } else {
      variant = {
        id: `var-${Date.now()}-${i}`,
        productId, sku, price: basePrice,
        quantity: 0, isDefault, status: "active",
        deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      };
      mockGeneratedVariants.push(variant);
    }

    results.push({ variant, label });
  }

  return results;
}

function cartesianProduct(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]]
  );
}
