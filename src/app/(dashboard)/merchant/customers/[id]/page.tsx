"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, ShoppingBag, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/dashboard/empty-state";
import { customersApi } from "@/services/customers.service";

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  totalSpent: number;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customersApi.get(id);
      setCustomer(data.customer ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="mb-4 h-5 w-20" />
              <div className="space-y-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="mb-4 h-5 w-28" />
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <EmptyState
        message="Customer not found"
        action={
          <Link
            href="/merchant/customers"
            className="text-sm font-medium text-[#7C3AED] hover:text-[#8B5CF6] transition-colors"
          >
            Back to customers
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/merchant/customers")}
          className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-[#7C3AED]/30 hover:text-[#F8FAFC]"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">Customer details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-lg font-bold text-white">
              {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F8FAFC]">{customer.name}</h2>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-muted-foreground shrink-0" />
              <span className="text-[#F8FAFC]">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={15} className="text-muted-foreground shrink-0" />
                <span className="text-[#F8FAFC]">{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={15} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Joined {new Date(customer.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBag size={16} className="shrink-0" />
              Total Orders
            </div>
            <p className="mt-2 text-3xl font-bold text-[#F8FAFC]">{customer.orderCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign size={16} className="shrink-0" />
              Total Spent
            </div>
            <p className="mt-2 text-3xl font-bold text-violet-400">
              ${customer.totalSpent.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
