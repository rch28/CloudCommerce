"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export interface WishlistItem {
  id: string;
  variantId: string;
  addedAt: string;
  variant: {
    id: string;
    sku: string;
    price: number;
    comparePrice: number | null;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      image: string | null;
      status: string;
    };
  };
}

interface WishlistContextType {
  items: WishlistItem[];
  count: number;
  loading: boolean;
  addItem: (variantId: string) => Promise<boolean>;
  removeItem: (variantId: string) => Promise<boolean>;
  isInWishlist: (variantId: string) => boolean;
  toggleItem: (variantId: string) => Promise<boolean>;
  moveToCart: (wishlistItemId: string, quantity?: number) => Promise<boolean>;
  generateShareLink: () => Promise<string | null>;
}

const SESSION_COOKIE = "cc_cart_session";

const WishlistContext = createContext<WishlistContextType | null>(null);

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

function ensureSessionCookie(): string {
  let sid = getCookie(SESSION_COOKIE);
  if (!sid) {
    sid = generateId();
    setCookie(SESSION_COOKIE, sid);
  }
  return sid;
}

async function fetchWithCookies(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  const count = items.length;

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetchWithCookies("/api/v1/wishlist");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    ensureSessionCookie();
    fetchWishlist();
  }, [fetchWishlist]);

  const addItem = useCallback(async (variantId: string) => {
    setLoading(true);
    try {
      const res = await fetchWithCookies("/api/v1/wishlist", {
        method: "POST",
        body: JSON.stringify({ variantId }),
      });
      if (res.ok) {
        await fetchWishlist();
      }
      return res.ok;
    } catch {
      await fetchWishlist();
      return false;
    }
  }, [fetchWishlist]);

  const removeItem = useCallback(async (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    try {
      const res = await fetchWithCookies(`/api/v1/wishlist/${variantId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        await fetchWishlist();
        return false;
      }
      return true;
    } catch {
      await fetchWishlist();
      return false;
    }
  }, [fetchWishlist]);

  const isInWishlist = useCallback(
    (variantId: string) => items.some((i) => i.variantId === variantId),
    [items],
  );

  const toggleItem = useCallback(async (variantId: string) => {
    if (isInWishlist(variantId)) {
      return removeItem(variantId);
    }
    return addItem(variantId);
  }, [isInWishlist, addItem, removeItem]);

  const moveToCart = useCallback(async (wishlistItemId: string, quantity = 1) => {
    try {
      const res = await fetchWithCookies("/api/v1/wishlist/move-to-cart", {
        method: "POST",
        body: JSON.stringify({ wishlistItemId, quantity }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== wishlistItemId));
      }
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const generateShareLink = useCallback(async () => {
    try {
      const res = await fetchWithCookies("/api/v1/wishlist/share", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        return data.shareToken as string;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count,
        loading,
        addItem,
        removeItem,
        isInWishlist,
        toggleItem,
        moveToCart,
        generateShareLink,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlistContext must be used within a WishlistProvider");
  return ctx;
}
