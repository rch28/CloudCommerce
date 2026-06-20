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

const PRODUCT_IMAGES = {
  headphones: [
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100847931_de8ea52e.jpg",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100856877_2e8d9795.jpg",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100847831_0a5e0cff.jpg",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100850320_f0bea040.jpg",
  ],
  watch: [
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100879701_30462bec.png",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100883193_2c442004.png",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100879991_39a48925.png",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100909935_bc2ac73b.png",
  ],
};

async function main() {
  console.log("=== CloudCommerce Seed ===\n");

  // ---------------------------------------------------------------------------
  // 1. Tenants
  // ---------------------------------------------------------------------------
  console.log("1. Creating tenants...");
  const platformTenant = await prisma.tenant.upsert({
    where: { subdomain: "platform" },
    update: {},
    create: { name: "CloudCommerce Platform", subdomain: "platform" },
  });
  console.log(`   Platform tenant: ${platformTenant.id}`);

  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: { name: "Demo Store Co.", subdomain: "demo" },
  });
  console.log(`   Demo merchant tenant: ${demoTenant.id}`);

  // Ensure fallback tenant exists for legacy/default tenantId usage
  await prisma.tenant.upsert({
    where: { id: "t-1" },
    update: {},
    create: { id: "t-1", name: "Default Tenant", subdomain: "default" },
  });
  console.log(`   Fallback tenant: t-1`);

  // ---------------------------------------------------------------------------
  // 2. Users
  // ---------------------------------------------------------------------------
  console.log("2. Creating users...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cloudcommerce.com" },
    update: {},
    create: {
      email: "admin@cloudcommerce.com",
      password: hashPassword("admin123"),
      name: "Platform Admin",
      role: "admin",
      tenantId: platformTenant.id,
    },
  });
  console.log(`   Admin user: admin@cloudcommerce.com / admin123`);

  const merchantUser = await prisma.user.upsert({
    where: { email: "merchant@demo.com" },
    update: {},
    create: {
      email: "merchant@demo.com",
      password: hashPassword("merchant123"),
      name: "Demo Merchant",
      role: "merchant",
      tenantId: demoTenant.id,
    },
  });
  console.log(`   Merchant user: merchant@demo.com / merchant123`);

  // ---------------------------------------------------------------------------
  // 3. Plans
  // ---------------------------------------------------------------------------
  console.log("3. Creating plans...");
  const plans = [
    {
      name: "Starter",
      slug: "starter",
      price: 29,
      features: [
        "Up to 100 products",
        "1 staff account",
        "Basic analytics",
        "Email support",
        "1 warehouse",
      ],
      maxProducts: 100,
      maxStaff: 1,
    },
    {
      name: "Growth",
      slug: "growth",
      price: 79,
      features: [
        "Up to 1,000 products",
        "5 staff accounts",
        "Advanced analytics",
        "Priority support",
        "Bulk discounting",
        "Multi-warehouse (up to 3)",
      ],
      maxProducts: 1000,
      maxStaff: 5,
    },
    {
      name: "Scale",
      slug: "scale",
      price: 199,
      features: [
        "Unlimited products",
        "Unlimited staff accounts",
        "Custom analytics & reports",
        "Dedicated support",
        "API access",
        "Unlimited warehouses",
        "Multi-currency",
      ],
      maxProducts: null,
      maxStaff: null,
    },
  ];

  const createdPlans: Record<string, any> = {};
  for (const p of plans) {
    const plan = await prisma.plan.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
    createdPlans[p.slug] = plan;
  }
  console.log(`   Created ${plans.length} plans`);

  // ---------------------------------------------------------------------------
  // 4. Subscription
  // ---------------------------------------------------------------------------
  console.log("4. Creating subscription...");
  const growthPlan = createdPlans["growth"];
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      planId: growthPlan.id,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
  console.log(`   Demo merchant subscribed to Growth plan`);

  // Create fallback subscription for t-1 tenant
  await prisma.subscription.upsert({
    where: { tenantId: "t-1" },
    update: {},
    create: {
      tenantId: "t-1",
      planId: growthPlan.id,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
  console.log(`   Fallback tenant subscribed to Growth plan`);

  // ---------------------------------------------------------------------------
  // 5. Store
  // ---------------------------------------------------------------------------
  console.log("5. Creating store...");
  const store = await prisma.store.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: "Demo Store Co.",
      slug: "demo-store",
      description: "Your premier destination for premium audio gear and cutting-edge wearable technology.",
      primaryColor: "#7C3AED",
      secondaryColor: "#8B5CF6",
      headingFont: "Inter",
      bodyFont: "Inter",
      contactEmail: "hello@demostore.com",
      contactPhone: "+1-800-DEMO-STORE",
      addressCountry: "US",
      addressState: "NY",
      addressCity: "New York",
      addressZip: "10001",
      subdomain: "demo",
      metaTitle: "Demo Store Co. — Premium Audio & Wearables",
      metaDescription: "Shop the latest in audio headphones and smart watches at Demo Store Co.",
    },
  });
  console.log(`   Store: ${store.name} (${store.slug})`);

  // Create fallback store for t-1 tenant
  await prisma.store.upsert({
    where: { slug_tenantId: { slug: "default-store", tenantId: "t-1" } },
    update: {},
    create: {
      tenantId: "t-1",
      name: "Default Store",
      slug: "default-store",
      subdomain: "default",
      primaryColor: "#7C3AED",
      secondaryColor: "#8B5CF6",
      headingFont: "Inter",
      bodyFont: "Inter",
    },
  });
  console.log(`   Fallback store created for t-1`);

  // ---------------------------------------------------------------------------
  // 6. Categories
  // ---------------------------------------------------------------------------
  console.log("6. Creating categories...");
  const categories: Record<string, any> = {};
  const categoryDefs = [
    { name: "Audio", slug: "audio", description: "Premium headphones, earbuds, and audio accessories." },
    { name: "Wearables", slug: "wearables", description: "Smart watches, fitness trackers, and wearable tech." },
    { name: "Accessories", slug: "accessories", description: "Cases, cables, chargers, and more." },
    { name: "Featured", slug: "featured", description: "Our hand-picked selection of top-rated products." },
  ];

  for (const c of categoryDefs) {
    const cat = await prisma.category.upsert({
      where: { slug_tenantId: { slug: c.slug, tenantId: demoTenant.id } },
      update: {},
      create: { ...c, tenantId: demoTenant.id },
    });
    categories[c.slug] = cat;
  }
  console.log(`   Created ${categoryDefs.length} categories`);

  // ---------------------------------------------------------------------------
  // 7. Products + Variants + Options + Images + Inventory
  // ---------------------------------------------------------------------------
  console.log("7. Creating products, variants, options, images, inventory...");

  interface ProductDef {
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    category: string;
    price: number;
    variants: { label: string; sku: string; qty: number }[];
    optionName: string;
  }

  const productDefs: ProductDef[] = [
    {
      name: "Aurora Wireless Headphones",
      slug: "aurora-wireless-headphones",
      description:
        "Experience crystal-clear audio with Aurora Wireless Headphones. Featuring advanced noise isolation and 30-hour battery life, these headphones deliver premium sound quality for music lovers and professionals alike.",
      shortDescription: "Premium wireless headphones with noise isolation and 30-hour battery life.",
      category: "audio",
      price: 199,
      variants: [
        { label: "Black", sku: "AUR-BLK", qty: 50 },
        { label: "Purple", sku: "AUR-PUR", qty: 30 },
        { label: "White", sku: "AUR-WHT", qty: 25 },
      ],
      optionName: "Color",
    },
    {
      name: "Nebula Noise-Cancelling Pro",
      slug: "nebula-noise-cancelling-pro",
      description:
        "Immerse yourself in pure sound with Nebula Noise-Cancelling Pro. Industry-leading active noise cancellation with adaptive transparency mode ensures you hear what matters most.",
      shortDescription: "Professional noise-cancelling headphones with adaptive transparency mode.",
      category: "audio",
      price: 299,
      variants: [
        { label: "Black", sku: "NEB-BLK", qty: 25 },
        { label: "Silver", sku: "NEB-SLV", qty: 15 },
      ],
      optionName: "Color",
    },
    {
      name: "Echo Bass Headphones",
      slug: "echo-bass-headphones",
      description:
        "Deep, powerful bass in a lightweight design. Echo Bass Headphones deliver punchy low-end performance perfect for bass enthusiasts who demand rich, immersive sound.",
      shortDescription: "Lightweight headphones with deep, powerful bass response.",
      category: "audio",
      price: 89,
      variants: [
        { label: "Black", sku: "ECH-BLK", qty: 100 },
        { label: "Blue", sku: "ECH-BLU", qty: 60 },
      ],
      optionName: "Color",
    },
    {
      name: "Quantum Smart Watch",
      slug: "quantum-smart-watch",
      description:
        "Stay connected and track your fitness with Quantum Smart Watch. Featuring a stunning AMOLED display, built-in GPS, and 24/7 health monitoring including heart rate and SpO2.",
      shortDescription: "Advanced smartwatch with AMOLED display and GPS tracking.",
      category: "wearables",
      price: 349,
      variants: [
        { label: "40mm", sku: "QNT-40", qty: 40 },
        { label: "44mm", sku: "QNT-44", qty: 30 },
      ],
      optionName: "Size",
    },
    {
      name: "Vertex Fitness Watch",
      slug: "vertex-fitness-watch",
      description:
        "Your ultimate fitness companion. Vertex Fitness Watch offers comprehensive workout tracking, continuous heart rate monitoring, sleep analysis, and 14-day battery life.",
      shortDescription: "Fitness-focused smartwatch with heart rate and sleep tracking.",
      category: "wearables",
      price: 229,
      variants: [
        { label: "S", sku: "VRT-S", qty: 20 },
        { label: "M", sku: "VRT-M", qty: 35 },
        { label: "L", sku: "VRT-L", qty: 25 },
      ],
      optionName: "Size",
    },
    {
      name: "Lumen Display Watch",
      slug: "lumen-display-watch",
      description:
        "Brilliant always-on display meets elegant design. Lumen Display Watch features a vibrant OLED screen, premium stainless steel construction, and advanced wellness tracking.",
      shortDescription: "Elegant smartwatch with vibrant always-on OLED display.",
      category: "wearables",
      price: 279,
      variants: [
        { label: "Graphite", sku: "LUM-GRP", qty: 10 },
        { label: "Rose", sku: "LUM-ROS", qty: 15 },
      ],
      optionName: "Color",
    },
    {
      name: "Orbit GPS Watch",
      slug: "orbit-gps-watch",
      description:
        "Precision GPS tracking for outdoor adventures. Orbit GPS Watch comes with multi-band GNSS, compass, barometric altimeter, and rugged construction built to withstand the elements.",
      shortDescription: "Premium GPS watch for outdoor adventures with multi-band tracking.",
      category: "wearables",
      price: 399,
      variants: [{ label: "44mm", sku: "ORB-44", qty: 12 }],
      optionName: "Size",
    },
    {
      name: "Vertex Watch Sport",
      slug: "vertex-watch-sport",
      description:
        "Sport-ready performance meets everyday style. Vertex Watch Sport is built for active lifestyles with rugged durability, water resistance, and interchangeable bands.",
      shortDescription: "Durable sports watch for active lifestyles with water resistance.",
      category: "wearables",
      price: 189,
      variants: [
        { label: "S", sku: "VWS-S", qty: 30 },
        { label: "M", sku: "VWS-M", qty: 45 },
        { label: "L", sku: "VWS-L", qty: 25 },
      ],
      optionName: "Size",
    },
  ];

  const isHeadphone = (slug: string) =>
    ["aurora-wireless-headphones", "nebula-noise-cancelling-pro", "echo-bass-headphones"].includes(slug);

  const products: any[] = [];
  const variantsBySku: Record<string, any> = {};

  for (const def of productDefs) {
    const existingProduct = await prisma.product.findUnique({
      where: { slug_tenantId: { slug: def.slug, tenantId: demoTenant.id } },
    });

    if (existingProduct) {
      console.log(`   Skipping existing product: ${def.name}`);
      products.push(existingProduct);
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: existingProduct.id },
      });
      for (const v of existingVariants) {
        variantsBySku[v.sku] = v;
      }
      continue;
    }

    const catId = categories[def.category]?.id;

    const product = await prisma.product.create({
      data: {
        tenantId: demoTenant.id,
        storeId: store.id,
        categoryId: catId,
        name: def.name,
        slug: def.slug,
        description: def.description,
        shortDescription: def.shortDescription,
        status: "active",
        averageRating: 0,
        reviewCount: 0,
      },
    });

    const imgs = isHeadphone(def.slug) ? PRODUCT_IMAGES.headphones : PRODUCT_IMAGES.watch;

    await prisma.productImage.createMany({
      data: [
        { productId: product.id, url: imgs[0], alt: `${def.name} - Image 1`, sortOrder: 0 },
        { productId: product.id, url: imgs[1], alt: `${def.name} - Image 2`, sortOrder: 1 },
      ],
    });

    const option = await prisma.productOption.create({
      data: {
        productId: product.id,
        name: def.optionName,
        sortOrder: 0,
      },
    });

    const isDefault = def.variants.length === 1;

    for (let i = 0; i < def.variants.length; i++) {
      const v = def.variants[i];
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          price: def.price,
          quantity: v.qty,
          isDefault: isDefault || i === 0,
          status: "active",
        },
      });

      await prisma.productOptionValue.create({
        data: {
          optionId: option.id,
          variantId: variant.id,
          label: v.label,
          value: v.label.toLowerCase(),
          sortOrder: i,
        },
      });

      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          quantity: v.qty,
          reserved: 0,
          lowStockThreshold: 10,
          reorderLevel: 5,
          tenantId: demoTenant.id,
        },
      });

      variantsBySku[v.sku] = variant;
    }

    products.push(product);
    console.log(`   Created product: ${def.name} (${def.variants.length} variants)`);
  }

  console.log(`   Total products: ${products.length}`);

  // ---------------------------------------------------------------------------
  // 8. Customers
  // ---------------------------------------------------------------------------
  console.log("8. Creating customers...");
  const customerData = [
    { name: "Liam Carter", email: "liam@mail.com", phone: "+1-212-555-0101" },
    { name: "Sophia Reyes", email: "sophia@mail.com", phone: "+1-310-555-0202" },
    { name: "Noah Patel", email: "noah@mail.com", phone: "+1-312-555-0303" },
    { name: "Emma Liang", email: "emma@mail.com", phone: "+1-415-555-0404" },
    { name: "Mason Cole", email: "mason@mail.com", phone: "+1-512-555-0505" },
    { name: "Ava Morgan", email: "ava@mail.com", phone: "+1-206-555-0606" },
  ];

  const customers: any[] = [];
  for (const c of customerData) {
    const customer = await prisma.customer.upsert({
      where: { email_tenantId: { email: c.email, tenantId: demoTenant.id } },
      update: {},
      create: { ...c, tenantId: demoTenant.id },
    });
    customers.push(customer);
  }
  console.log(`   Created ${customers.length} customers`);

  // ---------------------------------------------------------------------------
  // 9. Orders + Items + Addresses
  // ---------------------------------------------------------------------------
  console.log("9. Creating orders...");

  const [liam, sophia, noah, emma, mason, ava] = customers;

  const orderDefs = [
    {
      number: "#ORD-9241",
      customer: liam,
      status: "delivered",
      shipping: 0,
      tax: 0,
      items: [
        { sku: "AUR-BLK", qty: 1 },
        { sku: "AUR-PUR", qty: 1 },
      ],
      address: { label: "Home", line1: "123 Main St", city: "New York", state: "NY", zip: "10001", country: "US" },
    },
    {
      number: "#ORD-9240",
      customer: sophia,
      status: "shipped",
      shipping: 0,
      tax: 0,
      items: [{ sku: "QNT-40", qty: 1 }],
      address: { label: "Home", line1: "456 Oak Ave", city: "Los Angeles", state: "CA", zip: "90001", country: "US" },
    },
    {
      number: "#ORD-9239",
      customer: noah,
      status: "paid",
      shipping: 0,
      tax: 0,
      items: [
        { sku: "NEB-BLK", qty: 1 },
        { sku: "VRT-S", qty: 1 },
        { sku: "ECH-BLK", qty: 1 },
      ],
      address: { label: "Home", line1: "789 Pine Rd", city: "Chicago", state: "IL", zip: "60007", country: "US" },
    },
    {
      number: "#ORD-9238",
      customer: emma,
      status: "pending",
      shipping: 0,
      tax: 0,
      items: [{ sku: "AUR-WHT", qty: 1 }],
      address: { label: "Home", line1: "321 Elm St", city: "San Francisco", state: "CA", zip: "94101", country: "US" },
    },
    {
      number: "#ORD-9237",
      customer: mason,
      status: "delivered",
      shipping: 0,
      tax: 0,
      items: [
        { sku: "NEB-SLV", qty: 1 },
        { sku: "VRT-M", qty: 1 },
      ],
      address: { label: "Home", line1: "654 Maple Dr", city: "Austin", state: "TX", zip: "73301", country: "US" },
    },
    {
      number: "#ORD-9236",
      customer: ava,
      status: "paid",
      shipping: 20,
      tax: 20,
      items: [
        { sku: "AUR-BLK", qty: 2 },
        { sku: "QNT-40", qty: 1 },
        { sku: "ECH-BLK", qty: 1 },
      ],
      address: { label: "Home", line1: "987 Walnut Ln", city: "Seattle", state: "WA", zip: "98101", country: "US" },
    },
    {
      number: "#ORD-9235",
      customer: emma,
      status: "cancelled",
      shipping: 0,
      tax: 0,
      items: [{ sku: "ECH-BLU", qty: 1 }],
      address: { label: "Home", line1: "321 Elm St", city: "San Francisco", state: "CA", zip: "94101", country: "US" },
    },
    {
      number: "#ORD-9234",
      customer: sophia,
      status: "shipped",
      shipping: 20,
      tax: 0,
      items: [
        { sku: "QNT-44", qty: 1 },
        { sku: "ECH-BLK", qty: 1 },
      ],
      address: { label: "Home", line1: "456 Oak Ave", city: "Los Angeles", state: "CA", zip: "90001", country: "US" },
    },
  ];

  for (const od of orderDefs) {
    const exists = await prisma.order.findUnique({ where: { number: od.number } });
    if (exists) {
      console.log(`   Skipping existing order: ${od.number}`);
      continue;
    }

    const itemDetails = od.items.map((it) => {
      const v = variantsBySku[it.sku];
      return { variantId: v.id, productName: v.sku, sku: v.sku, price: Number(v.price), quantity: it.qty };
    });

    const subtotal = itemDetails.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const total = subtotal + od.shipping + od.tax;

    await prisma.order.create({
      data: {
        number: od.number,
        customerId: od.customer.id,
        tenantId: demoTenant.id,
        status: od.status,
        subtotal,
        shipping: od.shipping,
        tax: od.tax,
        total,
        items: { create: itemDetails },
        address: { create: od.address },
      },
    });
    console.log(`   Created order: ${od.number} (${od.status}, $${total})`);
  }

  // ---------------------------------------------------------------------------
  // 10. Tax Zones + Rates
  // ---------------------------------------------------------------------------
  console.log("10. Creating tax zones and rates...");

  const taxZoneDefs = [
    { name: "US-General", type: "country" as const, country: "US", rate: 0.08, rateName: "US Standard Rate" },
    { name: "CA-General", type: "country" as const, country: "CA", rate: 0.1, rateName: "CA Standard Rate" },
  ];

  for (const tz of taxZoneDefs) {
    const existing = await prisma.taxZone.findFirst({
      where: { tenantId: demoTenant.id, name: tz.name },
    });
    if (existing) {
      const rateExists = await prisma.taxRate.findFirst({
        where: { tenantId: demoTenant.id, zoneId: existing.id, name: tz.rateName },
      });
      if (!rateExists) {
        await prisma.taxRate.create({
          data: {
            tenantId: demoTenant.id,
            zoneId: existing.id,
            name: tz.rateName,
            type: "percentage",
            rate: tz.rate,
            priority: 0,
            isActive: true,
          },
        });
      }
    } else {
      const zone = await prisma.taxZone.create({
        data: { tenantId: demoTenant.id, name: tz.name, type: tz.type, country: tz.country, isActive: true },
      });
      await prisma.taxRate.create({
        data: {
          tenantId: demoTenant.id,
          zoneId: zone.id,
          name: tz.rateName,
          type: "percentage",
          rate: tz.rate,
          priority: 0,
          isActive: true,
        },
      });
    }
  }
  console.log(`   Tax zones and rates ready`);

  // ---------------------------------------------------------------------------
  // 11. CMS Pages + Sections
  // ---------------------------------------------------------------------------
  console.log("11. Creating CMS pages...");

  const homePage =
    (await prisma.page.findUnique({
      where: { slug_tenantId: { slug: "home", tenantId: demoTenant.id } },
    })) ??
    (await prisma.page.create({
      data: {
        tenantId: demoTenant.id,
        title: "Home",
        slug: "home",
        type: "custom",
        status: "published",
        isHomePage: true,
        publishedAt: new Date(),
      },
    }));

  if ((await prisma.pageSection.count({ where: { pageId: homePage.id } })) === 0) {
    await prisma.pageSection.createMany({
      data: [
        {
          pageId: homePage.id,
          tenantId: demoTenant.id,
          type: "hero",
          sortOrder: 0,
          content: {
            heading: "Welcome to Demo Store Co.",
            subheading: "Discover premium audio gear and cutting-edge wearable technology.",
            buttonText: "Shop Now",
            buttonLink: "/products",
          },
        },
        {
          pageId: homePage.id,
          tenantId: demoTenant.id,
          type: "features",
          sortOrder: 1,
          content: {
            heading: "Why Choose Us",
            features: [
              { title: "Premium Quality", description: "Hand-picked products from top brands." },
              { title: "Fast Shipping", description: "Free shipping on orders over $50." },
              { title: "24/7 Support", description: "We're here to help anytime." },
            ],
          },
        },
        {
          pageId: homePage.id,
          tenantId: demoTenant.id,
          type: "cta",
          sortOrder: 2,
          content: {
            heading: "Ready to Upgrade?",
            subheading: "Join thousands of satisfied customers.",
            buttonText: "Get Started",
            buttonLink: "/products",
            backgroundImage: null,
          },
        },
      ],
    });
  }

  const aboutPage =
    (await prisma.page.findUnique({
      where: { slug_tenantId: { slug: "about", tenantId: demoTenant.id } },
    })) ??
    (await prisma.page.create({
      data: {
        tenantId: demoTenant.id,
        title: "About Us",
        slug: "about",
        type: "custom",
        status: "published",
        metaTitle: "About Demo Store Co.",
        metaDescription: "Learn about our story and mission.",
        publishedAt: new Date(),
      },
    }));

  if ((await prisma.pageSection.count({ where: { pageId: aboutPage.id } })) === 0) {
    await prisma.pageSection.createMany({
      data: [
        {
          pageId: aboutPage.id,
          tenantId: demoTenant.id,
          type: "hero",
          sortOrder: 0,
          content: {
            heading: "About Us",
            subheading: "Our story and mission.",
          },
        },
        {
          pageId: aboutPage.id,
          tenantId: demoTenant.id,
          type: "content",
          sortOrder: 1,
          content: {
            body: "Demo Store Co. is a premier retailer of audio equipment and wearable technology. Founded in 2024, we've been delivering top-quality products to customers worldwide with a focus on exceptional service and satisfaction.",
          },
        },
      ],
    });
  }
  console.log(`   Created 2 CMS pages with sections`);

  // ---------------------------------------------------------------------------
  // 12. Banners
  // ---------------------------------------------------------------------------
  console.log("12. Creating banners...");

  const bannerDefs = [
    {
      title: "Summer Sale",
      subtitle: "Up to 30% off select audio gear",
      position: "top",
      type: "promotional",
      bgColor: "#7C3AED",
      textColor: "#ffffff",
      isActive: true,
      sortOrder: 0,
    },
    {
      title: "New Arrivals",
      subtitle: "Check out the latest smart watches",
      position: "top",
      type: "promotional",
      bgColor: "#06b6d4",
      textColor: "#ffffff",
      isActive: true,
      sortOrder: 1,
    },
  ];

  for (const b of bannerDefs) {
    const existingBanner = await prisma.banner.findFirst({
      where: { tenantId: demoTenant.id, title: b.title },
    });
    if (!existingBanner) {
      await prisma.banner.create({ data: { ...b, tenantId: demoTenant.id } });
    }
  }

  const bannerCount = await prisma.banner.count({ where: { tenantId: demoTenant.id } });
  console.log(`   ${bannerCount} banners`);

  // ---------------------------------------------------------------------------
  // 13. Loyalty Accounts + Reward Rules
  // ---------------------------------------------------------------------------
  console.log("13. Creating loyalty accounts and reward rules...");

  const maybeLiamLoyalty = await prisma.loyaltyAccount.findFirst({
    where: { customerId: liam.id, tenantId: demoTenant.id },
  });
  if (!maybeLiamLoyalty) {
    const liamAccount = await prisma.loyaltyAccount.create({
      data: {
        tenantId: demoTenant.id,
        customerId: liam.id,
        points: 250,
        lifetimePoints: 250,
        tier: "bronze",
      },
    });
    await prisma.loyaltyTransaction.create({
      data: {
        accountId: liamAccount.id,
        tenantId: demoTenant.id,
        type: "earned",
        points: 250,
        balanceBefore: 0,
        balanceAfter: 250,
        description: "Welcome bonus points",
      },
    });
  }

  const maybeAvaLoyalty = await prisma.loyaltyAccount.findFirst({
    where: { customerId: ava.id, tenantId: demoTenant.id },
  });
  if (!maybeAvaLoyalty) {
    const avaAccount = await prisma.loyaltyAccount.create({
      data: {
        tenantId: demoTenant.id,
        customerId: ava.id,
        points: 1200,
        lifetimePoints: 1500,
        tier: "silver",
      },
    });
    await prisma.loyaltyTransaction.createMany({
      data: [
        {
          accountId: avaAccount.id,
          tenantId: demoTenant.id,
          type: "earned",
          points: 1000,
          balanceBefore: 0,
          balanceAfter: 1000,
          description: "Purchase points accumulated",
        },
        {
          accountId: avaAccount.id,
          tenantId: demoTenant.id,
          type: "earned",
          points: 500,
          balanceBefore: 1000,
          balanceAfter: 1500,
          description: "Bonus tier upgrade points",
        },
        {
          accountId: avaAccount.id,
          tenantId: demoTenant.id,
          type: "redeemed",
          points: 300,
          balanceBefore: 1500,
          balanceAfter: 1200,
          referenceType: "order",
          referenceId: "#ORD-9236",
          description: "Redeemed for order discount",
        },
      ],
    });
  }

  const rewardRuleDefs = [
    {
      name: "Purchase Points",
      type: "earn",
      eventType: "purchase",
      points: 1,
      isActive: true,
    },
    {
      name: "Welcome Bonus",
      type: "earn",
      eventType: "signup",
      points: 100,
      isActive: true,
    },
    {
      name: "Birthday Bonus",
      type: "earn",
      eventType: "birthday",
      points: 50,
      isActive: true,
    },
  ];

  for (const r of rewardRuleDefs) {
    const exists = await prisma.rewardRule.findFirst({
      where: { tenantId: demoTenant.id, name: r.name },
    });
    if (!exists) {
      await prisma.rewardRule.create({ data: { ...r, tenantId: demoTenant.id } });
    }
  }
  console.log(`   Created loyalty accounts and reward rules`);

  // ---------------------------------------------------------------------------
  // 14. Warehouses + Warehouse Inventory
  // ---------------------------------------------------------------------------
  console.log("14. Creating warehouses and inventory...");

  const whDefs = [
    { name: "Main Warehouse - NY", code: "MAIN-NY", type: "main", city: "New York", state: "NY", zip: "10001" },
    { name: "West Coast - CA", code: "WEST-CA", type: "fulfillment", city: "Los Angeles", state: "CA", zip: "90001" },
  ];

  const warehouses: any[] = [];
  for (const w of whDefs) {
    const existing = await prisma.warehouse.findUnique({
      where: { code_tenantId: { code: w.code, tenantId: demoTenant.id } },
    });
    if (existing) {
      warehouses.push(existing);
    } else {
      const wh = await prisma.warehouse.create({ data: { ...w, tenantId: demoTenant.id } });
      warehouses.push(wh);
    }
  }

  const [mainWh, westWh] = warehouses;

  for (const [, variant] of Object.entries(variantsBySku)) {
    for (const wh of warehouses) {
      const exists = await prisma.warehouseInventory.findUnique({
        where: { warehouseId_variantId: { warehouseId: wh.id, variantId: variant.id } },
      });
      if (exists) continue;

      const qty = wh === mainWh ? Math.floor(Number(variant.quantity) * 0.7) : Math.floor(Number(variant.quantity) * 0.3);
      if (qty > 0) {
        await prisma.warehouseInventory.create({
          data: {
            warehouseId: wh.id,
            variantId: variant.id,
            quantity: qty,
            reserved: 0,
            lowStockThreshold: 5,
          },
        });
      }
    }
  }
  console.log(`   Created ${warehouses.length} warehouses with inventory records`);

  // ---------------------------------------------------------------------------
  // 15. Coupons
  // ---------------------------------------------------------------------------
  console.log("15. Creating coupons...");

  const couponDefs = [
    {
      code: "WELCOME10",
      type: "percentage" as const,
      value: 10,
      maxDiscount: 50,
      minOrderAmount: 50,
      maxUses: 100,
      appliesTo: "all",
      firstOrderOnly: true,
      startsAt: new Date("2026-01-01"),
      expiresAt: new Date("2027-01-01"),
      isActive: true,
    },
    {
      code: "FREESHIP",
      type: "free_shipping" as const,
      value: 0,
      minOrderAmount: 75,
      maxUses: 500,
      appliesTo: "all",
      firstOrderOnly: false,
      startsAt: new Date("2026-01-01"),
      expiresAt: new Date("2027-01-01"),
      isActive: true,
    },
  ];

  for (const c of couponDefs) {
    await prisma.coupon.upsert({
      where: { code_tenantId: { code: c.code, tenantId: demoTenant.id } },
      update: {},
      create: { ...c, productIds: [], categoryIds: [], customerIds: [], tenantId: demoTenant.id },
    });
  }
  console.log(`   Created ${couponDefs.length} coupons`);

  // ---------------------------------------------------------------------------
  // 16. Shipping Zones + Methods + Rates
  // ---------------------------------------------------------------------------
  console.log("16. Creating shipping zones, methods, and rates...");

  const shipZoneDefs = [
    { name: "US Domestic", countries: ["US"] },
    { name: "International", countries: ["CA", "GB", "DE", "FR", "AU"] },
  ];

  const shippZones: any[] = [];
  for (const sz of shipZoneDefs) {
    const existing = await prisma.shippingZone.findFirst({
      where: { tenantId: demoTenant.id, name: sz.name },
    });
    if (existing) {
      shippZones.push(existing);
    } else {
      const zone = await prisma.shippingZone.create({
        data: { tenantId: demoTenant.id, name: sz.name, countries: sz.countries, states: [], regions: [], zipCodes: [] },
      });
      shippZones.push(zone);
    }
  }
  const [usShipZone, intlShipZone] = shippZones;

  const methods = [
    { name: "Standard Shipping", type: "flat" as const, configuration: { rate: 5.99 }, isActive: true, sortOrder: 0 },
    { name: "Express Shipping", type: "flat" as const, configuration: { rate: 14.99 }, isActive: true, sortOrder: 1 },
  ];

  const createdMethods: any[] = [];
  for (const m of methods) {
    const existing = await prisma.shippingMethod.findFirst({
      where: { tenantId: demoTenant.id, name: m.name },
    });
    if (existing) {
      createdMethods.push(existing);
    } else {
      const method = await prisma.shippingMethod.create({ data: { ...m, tenantId: demoTenant.id } });
      createdMethods.push(method);
    }
  }

  for (const zone of [usShipZone, intlShipZone]) {
    for (const method of createdMethods) {
      const price = method.name === "Standard Shipping" ? (zone === usShipZone ? 5.99 : 12.99) : (zone === usShipZone ? 14.99 : 29.99);
      await prisma.shippingRate.upsert({
        where: { zoneId_methodId: { zoneId: zone.id, methodId: method.id } },
        update: {},
        create: { zoneId: zone.id, methodId: method.id, price },
      });
    }
  }
  console.log(`   Created 2 shipping zones, ${createdMethods.length} methods, and rates`);

  // ---------------------------------------------------------------------------
  // 17. Notifications
  // ---------------------------------------------------------------------------
  console.log("17. Creating notifications...");

  if ((await prisma.notification.count({ where: { tenantId: demoTenant.id } })) === 0) {
    await prisma.notification.createMany({
      data: [
        {
          tenantId: demoTenant.id,
          userId: merchantUser.id,
          type: "order.created",
          title: "New Order Received",
          body: "Order #ORD-9241 has been placed by Liam Carter.",
          channel: "in_app",
        },
        {
          tenantId: demoTenant.id,
          userId: merchantUser.id,
          type: "inventory.low",
          title: "Low Stock Alert",
          body: "Echo Bass Headphones (Blue) is running low on stock.",
          channel: "in_app",
        },
        {
          tenantId: demoTenant.id,
          userId: merchantUser.id,
          type: "payment.received",
          title: "Payment Received",
          body: "Payment of $617.00 received for order #ORD-9239.",
          channel: "in_app",
        },
        {
          tenantId: demoTenant.id,
          userId: merchantUser.id,
          type: "order.shipped",
          title: "Order Shipped",
          body: "Order #ORD-9240 has been shipped to Sophia Reyes.",
          channel: "in_app",
        },
        {
          tenantId: demoTenant.id,
          userId: merchantUser.id,
          type: "customer.joined",
          title: "New Customer",
          body: "A new customer has registered.",
          channel: "in_app",
        },
      ],
    });
  }
  console.log(`   Created notifications`);

  // ---------------------------------------------------------------------------
  // 18. Audit Logs
  // ---------------------------------------------------------------------------
  console.log("18. Creating audit logs...");

  if ((await prisma.auditLog.count({ where: { tenantId: demoTenant.id } })) === 0) {
    await prisma.auditLog.createMany({
      data: [
        { entityType: "Product", entityId: products[0]?.id ?? "", action: "created", changes: JSON.stringify({ name: "Aurora Wireless Headphones" }), userId: merchantUser.id, tenantId: demoTenant.id },
        { entityType: "Order", entityId: "ORD-9241", action: "status_changed", changes: JSON.stringify({ from: "pending", to: "delivered" }), userId: merchantUser.id, tenantId: demoTenant.id },
        { entityType: "Customer", entityId: liam.id, action: "registered", changes: JSON.stringify({ name: "Liam Carter" }), userId: null, tenantId: demoTenant.id },
        { entityType: "Product", entityId: products[3]?.id ?? "", action: "updated", changes: JSON.stringify({ price: { from: 299, to: 349 } }), userId: merchantUser.id, tenantId: demoTenant.id },
        { entityType: "Order", entityId: "ORD-9239", action: "payment_received", changes: JSON.stringify({ amount: 617 }), userId: null, tenantId: demoTenant.id },
      ],
    });
  }
  console.log(`   Created audit logs`);

  // ---------------------------------------------------------------------------
  // 19. Carts + Cart Items
  // ---------------------------------------------------------------------------
  console.log("19. Creating carts...");

  const cartDefs = [
    {
      customer: liam,
      items: [
        { sku: "AUR-BLK", qty: 1, price: 199 },
        { sku: "VWS-M", qty: 2, price: 189 },
      ],
    },
    {
      customer: sophia,
      items: [{ sku: "LUM-GRP", qty: 1, price: 279 }],
    },
  ];

  for (const cd of cartDefs) {
    const existingCart = await prisma.cart.findFirst({
      where: { customerId: cd.customer.id, tenantId: demoTenant.id },
    });
    if (existingCart) {
      console.log(`   Cart exists for ${cd.customer.name}, skipping`);
      continue;
    }

    const cart = await prisma.cart.create({
      data: {
        customerId: cd.customer.id,
        tenantId: demoTenant.id,
      },
    });

    await prisma.cartItem.createMany({
      data: cd.items.map((it) => ({
        cartId: cart.id,
        variantId: variantsBySku[it.sku].id,
        quantity: it.qty,
        price: it.price,
      })),
    });
    console.log(`   Created cart for ${cd.customer.name}`);
  }

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------
  console.log("\n=== Seed complete ===");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
