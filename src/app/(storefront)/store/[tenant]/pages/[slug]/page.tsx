import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/services/cms";
import { getSettingsBySlug } from "@/lib/services/settings";
import { STOREFRONT_REVALIDATE } from "@/lib/storefront";
import PageRenderer from "@/components/storefront/page-renderer";

export const revalidate = STOREFRONT_REVALIDATE;

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

  const brandColor = store?.primaryColor || "#7C3AED";
  const secondaryColor = store?.secondaryColor || "#8B5CF6";

  return (
    <div>
      {page.metaTitle && (
        <div className="sr-only">
          <title>{page.metaTitle}</title>
          {page.metaDescription && <meta name="description" content={page.metaDescription} />}
        </div>
      )}
      <PageRenderer sections={page.sections ?? []} brandColor={brandColor} secondaryColor={secondaryColor} tenant={tenant} />
    </div>
  );
}
