"use client";
import HeroRenderer from "@/components/storefront/blocks/hero-renderer";
import TextRenderer from "@/components/storefront/blocks/text-renderer";
import ImageRenderer from "@/components/storefront/blocks/image-renderer";
import ProductGridRenderer from "@/components/storefront/blocks/product-grid-renderer";
import CategoryGridRenderer from "@/components/storefront/blocks/category-grid-renderer";
import BannerRenderer from "@/components/storefront/blocks/banner-renderer";
import CtaRenderer from "@/components/storefront/blocks/cta-renderer";

interface Section {
  id: string;
  type: string;
  content: Record<string, unknown>;
  styles: Record<string, unknown> | null;
  sortOrder: number;
  isVisible: boolean;
}

interface PageRendererProps {
  sections: Section[];
  brandColor: string;
  secondaryColor: string;
  tenant: string;
}

const renderers: Record<string, React.ComponentType<any>> = {
  hero: HeroRenderer,
  text: TextRenderer,
  image: ImageRenderer,
  product_grid: ProductGridRenderer,
  category_grid: CategoryGridRenderer,
  banner: BannerRenderer,
  cta: CtaRenderer,
};

export default function PageRenderer({ sections, brandColor, secondaryColor, tenant }: PageRendererProps) {
  if (!sections?.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">This page has no content yet.</p>
      </div>
    );
  }

  return (
    <div>
      {sections
        .filter((s) => s.isVisible !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => {
          const Renderer = renderers[section.type];
          if (!Renderer) return null;
          return (
            <Renderer
              key={section.id}
              content={section.content}
              styles={section.styles ?? {}}
              brandColor={brandColor}
              secondaryColor={secondaryColor}
              tenant={tenant}
            />
          );
        })}
    </div>
  );
}
