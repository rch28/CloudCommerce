"use client";
import PageHeader from "@/components/dashboard/page-header";
import BillingView from "@/components/cc/views/BillingView";
export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" description="Manage your subscription, invoices, and plan" />
      <BillingView />
    </>
  );
}
