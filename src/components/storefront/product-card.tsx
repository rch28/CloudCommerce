"use client";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  stock: number;
  sold: number;
  tenant: string;
  category: string;
  variantId?: string;
}

export default function ProductCard({ id, name, slug, price, image, stock, sold, tenant, category, variantId }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const outOfStock = stock <= 0;
  const base = `/store/${tenant}`;

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50 hover:shadow-lg hover:shadow-[#7C3AED]/10">
      <Link href={`${base}/products/${slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#18181B]">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded-lg bg-rose-500/20 px-3 py-1 text-sm font-medium text-rose-400">Sold out</span>
            </div>
          )}
          {variantId && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleItem(variantId); }}
              className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm transition-colors ${
                isInWishlist(variantId) ? "text-rose-500" : "text-white/70 hover:text-rose-400"
              }`}
              title={isInWishlist(variantId) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={16} fill={isInWishlist(variantId) ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-[#8B5CF6]">{category}</p>
        <Link href={`${base}/products/${slug}`}>
          <h4 className="mt-0.5 truncate font-medium text-[#F8FAFC] transition-colors hover:text-[#8B5CF6]">{name}</h4>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 text-amber-400">
            <Star size={11} fill="currentColor" /> {((sold % 45) + 1) / 10}
          </span>
          <span>({sold} sold)</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-[#F8FAFC]">${price.toFixed(2)}</span>
          <button
            onClick={() => {
              if (!outOfStock) addItem({
                variantId: variantId || `var-${id}`,
                productId: id, productName: name, slug, image, price, sku: `SKU-${id}`, quantity: 1,
              });
            }}
            disabled={outOfStock}
            className="flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart size={13} /> {outOfStock ? "Sold out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
