"use client";
import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Check, Minus, Plus, Star, Truck, Shield, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import Link from "next/link";

interface Variant {
  id: string; name: string; price: number; comparePrice: number | null; quantity: number; sku: string;
}

interface ProductData {
  id: string; name: string; slug: string; description: string; images: string[]; sold?: number;
  category?: { name: string } | null;
  variants: Variant[];
}

const inventoryStatus = (available: number) => {
  if (available <= 0) return { label: "Out of Stock", color: "text-rose-400" };
  if (available <= 5) return { label: `Low Stock — Only ${available} left`, color: "text-amber-400" };
  return { label: "In Stock", color: "text-emerald-400" };
};

export default function ProductDetailClient({ tenant, product, inventoryMap }: { tenant: string; product: ProductData; inventoryMap: Record<string, { quantity: number; reserved: number }> }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const [selectedVariant, setSelectedVariant] = useState<Variant>(product.variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const base = `/store/${tenant}`;

  if (!selectedVariant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-muted-foreground">This product has no variants available.</p>
        <Link href={`${base}/products`} className="mt-4 inline-block text-sm font-medium text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
          Back to products
        </Link>
      </div>
    );
  }

  const inv = inventoryMap[selectedVariant.id];
  const available = inv ? inv.quantity - inv.reserved : selectedVariant.quantity;
  const status = inventoryStatus(available);
  const outOfStock = available <= 0;
  const images = product.images?.length ? product.images : ["", "", ""];

  function handleAdd() {
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      image: images[0] || "",
      price: selectedVariant.price,
      sku: selectedVariant.sku,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`${base}/products`} className="hover:text-[#F8FAFC] transition-colors">Products</Link>
        <span>/</span>
        {product.category && <><Link href={`${base}/products?category=${product.category.name}`} className="hover:text-[#F8FAFC] transition-colors">{product.category.name}</Link><span>/</span></>}
        <span className="text-[#F8FAFC]">{product.name}</span>
      </nav>

      <p className={`mb-2 text-xs font-medium ${status.color}`}>{status.label}</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-[#18181B]">
            {images[selectedImage] ? (
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-muted-foreground text-sm">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`relative h-16 w-16 overflow-hidden rounded-lg border bg-[#18181B] ${i === selectedImage ? "border-[#7C3AED]" : "border-border"}`}>
                  {img ? (
                    <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">N/A</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-xs text-[#8B5CF6]">{product.category?.name ?? "General"}</p>
          <h1 className="mt-1 text-3xl font-bold text-[#F8FAFC]">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-amber-400"><Star size={14} fill="currentColor" /> {((product.sold ?? 0) % 45 + 1) / 10}</span>
            <span className="text-muted-foreground">({product.sold ?? 0} sold)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[#F8FAFC]">${selectedVariant.price.toFixed(2)}</span>
            {selectedVariant.comparePrice && (
              <span className="text-lg text-muted-foreground line-through">${selectedVariant.comparePrice.toFixed(2)}</span>
            )}
          </div>

          {product.variants.length > 1 && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-muted-foreground">Variant: <span className="text-[#F8FAFC]">{selectedVariant.name}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const vInv = inventoryMap[v.id];
                  const vAvail = vInv ? vInv.quantity - vInv.reserved : v.quantity;
                  return (
                    <button key={v.id} onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                      disabled={vAvail <= 0}
                      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                        selectedVariant.id === v.id
                          ? "border-[#7C3AED] bg-[#7C3AED]/20 text-[#7C3AED]"
                          : "border-border text-muted-foreground hover:border-[#7C3AED]/50 hover:text-[#F8FAFC]"
                      } disabled:cursor-not-allowed disabled:opacity-30`}
                    >
                      {v.name} — ${v.price.toFixed(2)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedVariant.sku && <p className="mt-4 text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>}

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{product.description || "No description provided."}</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-border">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-muted-foreground hover:text-[#F8FAFC] transition-colors"><Minus size={14} /></button>
              <span className="w-10 text-center text-sm text-[#F8FAFC]">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-muted-foreground hover:text-[#F8FAFC] transition-colors"><Plus size={14} /></button>
            </div>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all ${
                added
                  ? "bg-emerald-500 text-white"
                  : "bg-[#7C3AED] text-white hover:bg-[#8B5CF6]"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {added ? <><Check size={16} /> Added!</> : <><ShoppingCart size={16} /> {outOfStock ? "Sold Out" : "Add to Cart"}</>}
            </button>
            <button
              onClick={() => toggleItem(selectedVariant.id)}
              className={`p-3 rounded-lg border transition-all ${
                isInWishlist(selectedVariant.id)
                  ? "border-rose-500/50 bg-rose-500/10 text-rose-500"
                  : "border-border text-muted-foreground hover:text-rose-400 hover:border-rose-500/50"
              }`}
              title={isInWishlist(selectedVariant.id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={18} fill={isInWishlist(selectedVariant.id) ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="mt-8 space-y-3 border-t border-border pt-6">
            {[
              { icon: Truck, text: "Free shipping on orders over $100" },
              { icon: Shield, text: "Secure checkout with encrypted payment" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <item.icon size={15} className="text-[#7C3AED]" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
