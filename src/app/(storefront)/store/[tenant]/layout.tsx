import { getSettingsBySlug } from "@/lib/services/settings";
import StoreHeader from "@/components/storefront/header";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const store = await getSettingsBySlug(tenant).catch(() => null);
  const storeName = store?.name || tenant.charAt(0).toUpperCase() + tenant.slice(1);
  const logo = store?.logo || null;
  const primaryColor = store?.primaryColor || "#7C3AED";

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader
        tenant={tenant}
        storeName={storeName}
        logo={logo}
        primaryColor={primaryColor}
      />
      <main>{children}</main>
    </div>
  );
}