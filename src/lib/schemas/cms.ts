import { z } from "zod/v4";

export const blockTypes = ["hero", "text", "image", "product_grid", "category_grid", "banner", "cta"] as const;
export const pageTypes = ["home", "about", "contact", "landing", "custom"] as const;

export const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(["home", "about", "contact", "landing", "custom"]).default("custom"),
  status: z.enum(["draft", "published"]).default("draft"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isHomePage: z.boolean().default(false),
  sections: z.array(z.object({
    type: z.enum(["hero", "text", "image", "product_grid", "category_grid", "banner", "cta"]),
    content: z.record(z.string(), z.unknown()),
    styles: z.record(z.string(), z.unknown()).optional(),
    sortOrder: z.coerce.number().default(0),
    isVisible: z.boolean().default(true),
  })).optional(),
});

export const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  linkText: z.string().optional(),
  position: z.enum(["top", "bottom", "hero"]).default("top"),
  type: z.enum(["promotional", "informational", "seasonal"]).default("promotional"),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  sortOrder: z.coerce.number().default(0),
});

export type PageInput = z.infer<typeof pageSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
