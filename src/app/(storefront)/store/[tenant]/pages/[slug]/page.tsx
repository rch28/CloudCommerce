import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/services/cms";
import { getSettingsBySlug } from "@/lib/services/settings";
import PageRenderer from "@/components/storefront/page-renderer";

export function generateStaticParams() {
  return [];
}

export default async function PagePage({ params }: { params: Promise<{ tenant: string; slug: string }> }) {
  const { tenant, slug } = await params;
  const searchParams = await Promise.resolve({});

  const [page, store] = await Promise.all([
    getPageBySlug(slug, tenant).catch(() => null),
    getSettingsBySlug(tenant).catch(() => null),
  ]);

  if (!page) notFound();

  const p = page as { metaTitle?: string; metaDescription?: string; sections?: { id: string; type: string; content: Record<string, unknown>; styles: Record<string, unknown> | null; sortOrder: number; isVisible: boolean }[] };
  const brandColor = store?.primaryColor || "#7C3AED";
  const secondaryColor = store?.secondaryColor || "#8B5CF6";

  return (
    <div>
      {p.metaTitle && (
        <div className="sr-only">
          <title>{p.metaTitle}</title>
          {p.metaDescription && <meta name="description" content={p.metaDescription} />}
        </div>
      )}
      <PageRenderer sections={p.sections ?? []} brandColor={brandColor} secondaryColor={secondaryColor} tenant={tenant} />
    </div>
  );
}
