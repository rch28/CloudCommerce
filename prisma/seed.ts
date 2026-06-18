import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, pbkdf2Sync } from "crypto";
import { readFileSync, existsSync } from "node:fs";

const envPath = ".env";
if (existsSync(envPath) && !process.env.DATABASE_URL) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    let value = trimmed.slice(sep + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = randomBytes(32).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database...");

  const adminEmail = "admin@cloudcommerce.com";
  const merchantEmail = "merchant@demo.com";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const existingMerchant = await prisma.user.findUnique({ where: { email: merchantEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashPassword("admin123"),
        name: "Platform Admin",
        role: "admin",
      },
    });
    console.log(`Created admin user: ${adminEmail} / admin123`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  if (!existingMerchant) {
    await prisma.user.create({
      data: {
        email: merchantEmail,
        password: hashPassword("merchant123"),
        name: "Demo Merchant",
        role: "merchant",
      },
    });
    console.log(`Created merchant user: ${merchantEmail} / merchant123`);
  } else {
    console.log(`Merchant user already exists: ${merchantEmail}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
