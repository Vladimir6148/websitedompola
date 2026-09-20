import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../types';
import { resolveImageUrl } from '../lib/images';
import { isPackSold, lineTotal, resolvePackArea } from '../lib/packaging';

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  /** Packs for flooring; pieces for piece-sold goods */
  quantity: number;
  packArea?: number | null;
  packQty?: number | null;
  length?: number | null;
  width?: number | null;
  soldByPack: boolean;
};

type CartContextValue = {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = 'dompola_cart_v2';

function toCartItem(product: Product, quantity: number): CartItem {
  const soldByPack = isPackSold(product);
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    unit: product.unit,
    image: resolveImageUrl(product.images?.[0]?.url),
    quantity: Math.max(1, Math.round(quantity)),
    packArea: resolvePackArea(product),
    packQty: product.packQty,
    length: product.length,
    width: product.width,
    soldByPack,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const add = (product: Product, qty = 1) => {
      const addQty = Math.max(1, Math.round(qty));
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + addQty } : i,
          );
        }
        return [...prev, toCartItem(product, addQty)];
      });
    };

    return {
      items,
      add,
      remove: (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
      setQty: (productId, quantity) =>
        setItems((prev) =>
          prev
            .map((i) =>
              i.productId === productId ? { ...i, quantity: Math.max(1, Math.round(quantity)) } : i,
            )
            .filter((i) => i.quantity > 0),
        ),
      clear: () => setItems([]),
      count: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce(
        (s, i) =>
          s +
          lineTotal(i.quantity, {
            price: i.price,
            unit: i.unit,
            packArea: i.packArea,
            packQty: i.packQty,
            length: i.length,
            width: i.width,
          }),
        0,
      ),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart outside provider');
  return ctx;
}
