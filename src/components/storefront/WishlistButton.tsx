"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

interface Props {
  variantId: string;
  className?: string;
  iconOnly?: boolean;
}

export default function WishlistButton({ variantId, className = "", iconOnly }: Props) {
  const { isInWishlist, toggleItem } = useWishlist();
  const inWishlist = isInWishlist(variantId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(variantId);
      }}
      className={`${className} ${inWishlist ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"}`}
      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart size={iconOnly ? 18 : 16} fill={inWishlist ? "currentColor" : "none"} />
      {!iconOnly && <span className="text-xs">{inWishlist ? "Saved" : "Save"}</span>}
    </button>
  );
}
