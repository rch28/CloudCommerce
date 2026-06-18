import type { Metadata } from "next";
import { getSettingsBySlug } from "@/lib/services/settings";
import StoreHeader from "@/components/storefront/header";
import StoreFooter from "@/components/storefront/footer";

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }): Promise<Metadata> {
  const { tenant } = await params;
  let store;
  try { store = await getSettingsBySlug(tenant); } catch { store = null; }
  const name = store?.name || tenant.charAt(0).toUpperCase() + tenant.slice(1);
  const title = store?.metaTitle || `${name} — Shop Online`;
  const description = store?.metaDescription || `Discover amazing products at ${name}.`;

  return {
    title: { default: title, template: `%s | ${name}` },
    description,
    openGraph: {
      title, description,
      siteName: name,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title, description,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `/store/${tenant}` },
  };
}

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  let store;
  try { store = await getSettingsBySlug(tenant); } catch { store = null; }
  const name = store?.name || tenant.charAt(0).toUpperCase() + tenant.slice(1);
  const brandPrimary = store?.primaryColor || "#7C3AED";
  const brandSecondary = store?.secondaryColor || "#8B5CF6";
  const headingFont = store?.headingFont || "Inter";
  const bodyFont = store?.bodyFont || "Inter";

  return (
    <div
      className="flex min-h-screen flex-col bg-[#09090B]"
      style={{
        "--brand-primary": brandPrimary,
        "--brand-secondary": brandSecondary,
        "--brand-heading-font": headingFont,
        "--brand-body-font": bodyFont,
      } as React.CSSProperties}
    >
      <StoreHeader tenant={tenant} storeName={name} logo={store?.logo} primaryColor={brandPrimary} />
      <main className="flex-1">{children}</main>
      <StoreFooter tenant={tenant} storeName={name} logo={store?.logo} primaryColor={brandPrimary} description={store?.description} />
    </div>
  );
}
