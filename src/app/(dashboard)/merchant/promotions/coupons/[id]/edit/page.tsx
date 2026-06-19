"use client";
import CouponFormView from "@/components/cc/views/CouponFormView";
import { useParams } from "next/navigation";
export default function Page() {
  const params = useParams();
  return <CouponFormView id={params.id as string} />;
}
