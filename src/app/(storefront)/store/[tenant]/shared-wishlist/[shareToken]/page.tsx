import SharedWishlistView from "@/components/storefront/SharedWishlistView";

export default async function Page({
  params: paramsPromise,
}: {
  params: Promise<{ tenant: string; shareToken: string }>;
}) {
  const { tenant, shareToken } = await paramsPromise;
  return <SharedWishlistView tenant={tenant} shareToken={shareToken} />;
}
