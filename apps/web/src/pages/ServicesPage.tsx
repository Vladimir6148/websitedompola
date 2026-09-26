import { useEffect, useState } from 'react';
import { Seo } from '../components/Seo';
import { api } from '../lib/api';
import type { Service } from '../types';

export function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  useEffect(() => {
    api<Service[]>('/api/content/services').then(setItems).catch(() => undefined);
  }, []);

  return (
    <>
      <Seo title="Услуги" path="/services" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Услуги</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((s) => (
            <div key={s.id} className="relative rounded-2xl border border-graphite/8 p-6">
              {s.badge ? (
                <span className="absolute right-4 top-4 inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">
                  {s.badge}
                </span>
              ) : null}
              <h2
                className={`font-display text-xl font-semibold ${s.badge ? 'pr-24' : ''}`}
              >
                {s.title}
              </h2>
              <p className="mt-2 text-graphite/65">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
