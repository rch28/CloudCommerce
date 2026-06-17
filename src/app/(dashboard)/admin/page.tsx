"use client";
import PageHeader from "@/components/dashboard/page-header";
import AdminDashboardView from "@/components/dashboard/admin/admin-view";
export default function Page() {
  return (
    <>
      <PageHeader title="Platform Admin" description="Manage all merchants and platform metrics" />
      <AdminDashboardView />
    </>
  );
}
