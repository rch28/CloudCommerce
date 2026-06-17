import { CartProvider } from "@/contexts/CartContext";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
