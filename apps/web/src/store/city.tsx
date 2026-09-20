import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { City } from '../types';

type CityContextValue = {
  cities: City[];
  city: City | null;
  setCityId: (id: string) => void;
};

const CityContext = createContext<CityContextValue | null>(null);
const KEY = 'dompola_city';

export function CityProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState(() => localStorage.getItem(KEY) || '');

  useEffect(() => {
    api<City[]>('/api/content/cities')
      .then((data) => {
        setCities(data);
        if (!cityId && data[0]) setCityId(data[0].id);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (cityId) localStorage.setItem(KEY, cityId);
  }, [cityId]);

  const value = useMemo(
    () => ({
      cities,
      city: cities.find((c) => c.id === cityId) || cities[0] || null,
      setCityId,
    }),
    [cities, cityId],
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity outside provider');
  return ctx;
}
