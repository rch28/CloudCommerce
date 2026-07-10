"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { wishlistApi } from "@/services/wishlist.service";

interface SharedItem {
  id: string;
  variantId: string;
  variant: {
    id: string;
    sku: string;
    price: number;
    comparePrice: number | null;
    product: {
      id: string;
      name: string;
      slug: string;
      image: string | null;
      storeName: string | null;
    };
  };
}

interface Props {
  tenant: string;
  shareToken: string;
}

export default function SharedWishlistView({ tenant, shareToken }: Props) {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const base = `/store/${tenant}`;

  useEffect(() => {
    wishlistApi.getByShareToken(shareToken)
      .then((data) => {
        setItems(data.items || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const handleAddToCart = async (item: SharedItem) => {
    setAdding(item.id);
    try {
      await wishlistApi.moveToCart({ wishlistItemId: item.id, quantity: 1 });
    } catch {}
    setAdding(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-bold mb-2">Wishlist not found</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This wishlist may have been deleted or the link is invalid.
        </p>
        <Link
          href={base}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <ArrowLeft size={16} /> Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={base}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft size={16} /> Back to store
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart size={24} className="text-rose-500" fill="currentColor" />
          {items[0]?.variant.product.storeName
            ? `${items[0].variant.product.storeName}'s Wishlist`
            : "Shared Wishlist"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium mb-2">This wishlist is empty</h2>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 border rounded-lg p-4 hover:bg-muted/20 transition-colors"
            >
              <Link
                href={`${base}/products/${item.variant.product.slug}`}
                className="shrink-0"
              >
                <div className="w-20 h-20 rounded-md bg-muted overflow-hidden">
                  {item.variant.product.image ? (
                    <img
                      src={item.variant.product.image}
                      alt={item.variant.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      No image
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`${base}/products/${item.variant.product.slug}`}>
                  <h3 className="font-medium text-sm truncate hover:text-primary">
                    {item.variant.product.name}
                  </h3>
                </Link>
                <p className="text-sm font-bold mt-1">
                  ${Number(item.variant.price).toFixed(2)}
                </p>
                {item.variant.comparePrice && (
                  <p className="text-xs text-muted-foreground line-through">
                    ${Number(item.variant.comparePrice).toFixed(2)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleAddToCart(item)}
                disabled={adding === item.id}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50 shrink-0"
              >
                <ShoppingCart size={14} />
                {adding === item.id ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
