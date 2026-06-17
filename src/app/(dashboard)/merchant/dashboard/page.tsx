"use client";
import PageHeader from "@/components/dashboard/page-header";
import MerchantDashboardView from "@/components/dashboard/merchant/dashboard-view";
export default function Page() {
  return (
    <>
      <PageHeader title="Merchant Dashboard" description="Track your store performance and metrics" />
      <MerchantDashboardView />
    </>
  );
}
