import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearPriceMapCache } from '../lib/api';
import type { City } from '../types';

type CityContextValue = {
  cities: City[];
  city: City | null;
  /** Bumps when the shopper changes city — use in data-fetch deps. */
  cityRev: number;
  setCityId: (id: string) => void;
};

const CityContext = createContext<CityContextValue | null>(null);
const KEY = 'dompola_city';

export function CityProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityIdState] = useState(() => localStorage.getItem(KEY) || '');
  const [cityRev, setCityRev] = useState(0);

  useEffect(() => {
    api<City[]>('/api/content/cities')
      .then((data) => {
        setCities(data);
        if (!cityId && data[0]) setCityIdState(data[0].id);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    if (cityId) localStorage.setItem(KEY, cityId);
  }, [cityId]);

  // Admin price saves (other tab) → refresh catalog prices here.
  useEffect(() => {
    const bump = () => {
      clearPriceMapCache();
      setCityRev((n) => n + 1);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dompola_prices_rev') bump();
    };
    window.addEventListener('storage', onStorage);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('dompola-prices');
      bc.onmessage = () => bump();
    } catch {
      bc = null;
    }
    return () => {
      window.removeEventListener('storage', onStorage);
      bc?.close();
    };
  }, []);

  const setCityId = useCallback((id: string) => {
    setCityIdState((prev) => {
      if (prev === id) return prev;
      clearPriceMapCache();
      setCityRev((n) => n + 1);
      return id;
    });
  }, []);

  const value = useMemo(
    () => ({
      cities,
      city: cities.find((c) => c.id === cityId) || cities[0] || null,
      cityRev,
      setCityId,
    }),
    [cities, cityId, cityRev, setCityId],
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity outside provider');
  return ctx;
}
