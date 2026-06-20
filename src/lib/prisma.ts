import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Decimal } from "@prisma/client-runtime-utils";

const origToJSON = Decimal.prototype.toJSON;
Decimal.prototype.toJSON = function () {
  return Number(origToJSON.call(this)) as unknown as string;
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function initPrisma() {
  if (!process.env.DATABASE_URL) return undefined;
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

let _prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = initPrisma();
    if (!_prisma) {
      throw new Error("DATABASE_URL is not set. Prisma client is unavailable.");
    }
  }
  return _prisma;
}

/** @deprecated Use getPrisma() instead */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return getPrisma()[prop as keyof PrismaClient];
  },
});
