"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, Share2, ArrowLeft } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

interface Props {
  tenant: string;
}

export default function WishlistPage({ tenant }: Props) {
  const { items, loading, removeItem, moveToCart, generateShareLink } = useWishlist();
  const [shareUrl, setShareUrl] = useState("");
  const base = `/store/${tenant}`;

  const handleShare = async () => {
    const token = await generateShareLink();
    if (token) {
      setShareUrl(`${window.location.origin}/store/${tenant}/shared-wishlist/${token}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={base} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft size={16} /> Back to store
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart size={24} className="text-rose-500" fill="currentColor" />
            My Wishlist
          </h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm hover:bg-muted"
          >
            <Share2 size={16} /> Share
          </button>
        )}
      </div>

      {shareUrl && (
        <div className="mb-6 p-3 bg-muted/50 rounded-lg border text-sm">
          <p className="font-medium mb-1">Shareable link:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3 py-1.5 border rounded text-xs bg-background"
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground text-sm mb-6">Save items you love and come back to them later</p>
          <Link
            href={`${base}/products`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border rounded-lg p-4 hover:bg-muted/20 transition-colors">
              <Link href={`${base}/products/${item.variant.product.slug}`} className="shrink-0">
                <div className="w-20 h-20 rounded-md bg-muted overflow-hidden">
                  {item.variant.product.image ? (
                    <img src={item.variant.product.image} alt={item.variant.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No image</div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`${base}/products/${item.variant.product.slug}`}>
                  <h3 className="font-medium text-sm truncate hover:text-primary">{item.variant.product.name}</h3>
                </Link>
                <p className="text-sm font-bold mt-1">${Number(item.variant.price).toFixed(2)}</p>
                {item.variant.comparePrice && (
                  <p className="text-xs text-muted-foreground line-through">${Number(item.variant.comparePrice).toFixed(2)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.variant.quantity > 0 ? (
                  <button
                    onClick={() => moveToCart(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90"
                  >
                    <ShoppingCart size={14} /> Move to Cart
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Sold out</span>
                )}
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
