import WishlistPage from "@/components/storefront/WishlistPage";

export default async function Page({ params: paramsPromise }: { params: Promise<{ tenant: string }> }) {
  const params = await paramsPromise;
  return <WishlistPage tenant={params.tenant} />;
}
