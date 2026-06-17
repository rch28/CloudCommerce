import Link from "next/link";
import { ArrowRight, Zap, Shield, Truck } from "lucide-react";
import { listProducts } from "@/lib/services/products";
import ProductCard from "@/components/storefront/product-card";

export default async function StoreHomePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const productsResult = await listProducts(tenant);
  const products = Array.isArray(productsResult) ? productsResult : productsResult.items;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-[#F8FAFC] sm:text-5xl lg:text-6xl">
            Welcome to <span className="text-[#7C3AED]">{tenant.charAt(0).toUpperCase() + tenant.slice(1)}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Discover our curated collection of premium products. Quality you can trust, prices you will love.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={`/store/${tenant}/products`} className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors">
              Shop Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { icon: Zap, title: "Fast Delivery", desc: "Free shipping on orders over $100" },
              { icon: Shield, title: "Secure Payment", desc: "Your data is always protected" },
              { icon: Truck, title: "Easy Returns", desc: "30-day return policy, no questions asked" },
            ].map((feat) => (
              <div key={feat.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/20">
                  <feat.icon size={20} className="text-[#7C3AED]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#F8FAFC]">{feat.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#F8FAFC]">Featured Products</h2>
          <Link href={`/store/${tenant}/products`} className="text-sm font-medium text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
            View all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).filter(Boolean).map((p: any) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.variants?.[0]?.price ?? 0}
              image={p.images?.[0] ?? ""}
              stock={p.variants?.[0]?.quantity ?? 0}
              sold={p.sold ?? 0}
              tenant={tenant}
              category={p.category?.name ?? "General"}
              variantId={p.variants?.[0]?.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
