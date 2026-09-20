import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../types';
import { primaryImage } from '../lib/api';

export type FavoriteItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
};

type FavoritesContextValue = {
  items: FavoriteItem[];
  toggle: (product: Product) => void;
  has: (productId: string) => boolean;
  remove: (productId: string) => void;
  count: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const KEY = 'dompola_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      items,
      count: items.length,
      has: (id) => items.some((i) => i.productId === id),
      remove: (id) => setItems((prev) => prev.filter((i) => i.productId !== id)),
      toggle: (product) => {
        setItems((prev) => {
          if (prev.some((i) => i.productId === product.id)) {
            return prev.filter((i) => i.productId !== product.id);
          }
          return [
            ...prev,
            {
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: primaryImage(product),
            },
          ];
        });
      },
    }),
    [items],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites outside provider');
  return ctx;
}
