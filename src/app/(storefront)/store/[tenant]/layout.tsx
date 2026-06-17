import StoreHeader from "@/components/storefront/header";
import StoreFooter from "@/components/storefront/footer";

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return { title: `${tenant.charAt(0).toUpperCase() + tenant.slice(1)} Store` };
}

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const storeName = tenant.charAt(0).toUpperCase() + tenant.slice(1);

  return (
    <div className="flex min-h-screen flex-col bg-[#09090B]">
      <StoreHeader tenant={tenant} storeName={storeName} />
      <main className="flex-1">{children}</main>
      <StoreFooter tenant={tenant} storeName={storeName} />
    </div>
  );
}
