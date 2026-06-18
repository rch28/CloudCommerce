"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function AccountPage() {
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();

  useEffect(() => {
    router.replace(`/store/${tenant}/account/profile`);
  }, [router, tenant]);

  return null;
}
