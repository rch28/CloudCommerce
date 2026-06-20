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
import { calculatePricing, type PricingResult } from "@/lib/services/pricing";
import { cartApi } from "@/services/cart.service";
import { accountApi } from "@/services/account.service";

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  image: string;
  price: number;
  sku: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  pricing: PricingResult;
  loading: boolean;
  isAuthenticated: boolean;
  mergeAfterLogin: () => Promise<void>;
}

const GUEST_STORAGE_KEY = "cc_storefront_cart";
const SESSION_COOKIE = "cc_cart_session";

const CartContext = createContext<CartContextType | null>(null);

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

function loadGuestCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(GUEST_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
}

function ensureSessionCookie(): string {
  let sid = getCookie(SESSION_COOKIE);
  if (!sid) {
    sid = generateId();
    setCookie(SESSION_COOKIE, sid);
  }
  return sid;
}

function getTenantFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/\/store\/([^/]+)/);
  return match ? match[1] : null;
}

function cartItemsToPricing(items: CartItem[]) {
  return calculatePricing(items.map((i) => ({ price: i.price, quantity: i.quantity })));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialLoadDone = useRef(false);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const pricing = cartItemsToPricing(items);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    async function init() {
      try {
        await accountApi.getProfile();
        setIsAuthenticated(true);
        const tenantId = getTenantFromPath();
        if (tenantId) {
          try {
            const data = await cartApi.get(tenantId);
            if (data.items?.length) {
              setItems(data.items);
              setLoading(false);
              return;
            }
          } catch {}
          const guestItems = loadGuestCart();
          if (guestItems.length > 0) {
            await mergeGuestItems(guestItems, tenantId);
            return;
          }
        }
        setItems([]);
        setLoading(false);
        return;
      } catch {}

      setIsAuthenticated(false);
      ensureSessionCookie();
      setItems(loadGuestCart());
      setLoading(false);
    }

    init();
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      saveGuestCart(items);
    }
  }, [items, loading, isAuthenticated]);

  async function mergeGuestItems(guestItems: CartItem[], tenantId: string) {
    try {
      for (const item of guestItems) {
        await cartApi.addItem({
          tenantId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        });
      }
      localStorage.removeItem(GUEST_STORAGE_KEY);

      const data = await cartApi.get(tenantId);
      setItems(data.items || []);
    } catch {
      setItems(guestItems);
    }
    setLoading(false);
  }

  const addItem = useCallback(async (item: CartItem) => {
    if (isAuthenticated) {
      const tenantId = getTenantFromPath();
      if (!tenantId) return;
      try {
        await cartApi.addItem({
          tenantId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        });
        const data = await cartApi.get(tenantId);
        setItems(data.items || []);
      } catch {}
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        );
      }
      return [...prev, item];
    });
  }, [isAuthenticated]);

  const updateQuantity = useCallback(async (variantId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(variantId);
      return;
    }

    if (isAuthenticated) {
      const tenantId = getTenantFromPath();
      if (!tenantId) return;
      try {
        await cartApi.updateItem(variantId, { quantity, tenantId });
        const data = await cartApi.get(tenantId);
        setItems(data.items || []);
      } catch {}
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
    );
  }, [isAuthenticated]);

  const removeItem = useCallback(async (variantId: string) => {
    if (isAuthenticated) {
      const tenantId = getTenantFromPath();
      if (!tenantId) return;
      try {
        await cartApi.removeItem(variantId, tenantId);
        const data = await cartApi.get(tenantId);
        setItems(data.items || []);
      } catch {}
      return;
    }

    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, [isAuthenticated]);

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      const tenantId = getTenantFromPath();
      if (!tenantId) return;
      try {
        await cartApi.clear(tenantId);
      } catch {}
    }
    setItems([]);
  }, [isAuthenticated]);

  const mergeAfterLogin = useCallback(async () => {
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) return;

    const tenantId = getTenantFromPath();
    if (!tenantId) return;

    setIsAuthenticated(true);
    await mergeGuestItems(guestItems, tenantId);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
        pricing,
        loading,
        isAuthenticated,
        mergeAfterLogin,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
