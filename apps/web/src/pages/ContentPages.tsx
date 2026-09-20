import { useEffect, useState } from 'react';
import { Seo } from '../components/Seo';
import { api } from '../lib/api';
import type { Promotion, Store, Work } from '../types';

export function PromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  useEffect(() => {
    api<Promotion[]>('/api/promotions').then(setItems).catch(() => undefined);
  }, []);
  return (
    <>
      <Seo title="Акции" path="/promotions" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Акции</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-graphite/8">
              {p.image ? <img src={p.image} alt={p.title} className="aspect-[16/9] w-full object-cover" /> : null}
              <div className="p-5">
                {p.discountPercent ? <span className="text-sm font-bold text-brand">−{p.discountPercent}%</span> : null}
                <h2 className="mt-1 font-display text-xl font-semibold">{p.title}</h2>
                <p className="mt-2 text-sm text-graphite/65">{p.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

export function WorksPage() {
  const [items, setItems] = useState<Work[]>([]);
  useEffect(() => {
    api<Work[]>('/api/content/works').then(setItems).catch(() => undefined);
  }, []);
  return (
    <>
      <Seo title="Наши работы" path="/works" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Наши работы</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <article key={w.id}>
              <img src={w.image || ''} alt={w.title} className="aspect-[4/3] w-full rounded-2xl object-cover" />
              <h2 className="mt-3 font-semibold">{w.title}</h2>
              <p className="text-sm text-graphite/55">{[w.city, w.category].filter(Boolean).join(' · ')}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

export function StoresPage() {
  const [items, setItems] = useState<Store[]>([]);
  useEffect(() => {
    api<Store[]>('/api/stores').then(setItems).catch(() => undefined);
  }, []);
  return (
    <>
      <Seo title="Магазины" path="/stores" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Магазины</h1>
        <p className="mt-3 text-graphite/60">Шоурумы ДОМПОЛА. Карты Яндекс будут подключены на следующем этапе.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((s) => (
            <article key={s.id} className="rounded-2xl border border-graphite/8 p-5">
              <div className="text-sm text-brand">{s.city?.name}</div>
              <h2 className="mt-1 font-display text-xl font-semibold">{s.name}</h2>
              <p className="mt-3 text-sm">{s.address}</p>
              <p className="text-sm text-graphite/60">{s.schedule}</p>
              {s.phone ? <a className="mt-3 inline-block text-brand" href={`tel:${s.phone}`}>{s.phone}</a> : null}
              {s.lat && s.lng ? (
                <p className="mt-2 text-xs text-graphite/40">Координаты: {s.lat}, {s.lng}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

export function ContactsPage() {
  return (
    <>
      <Seo title="Контакты" path="/contacts" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Контакты</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 text-lg">
            <p><a href="tel:+78182650000" className="font-semibold hover:text-brand">+7 (8182) 65-00-00</a></p>
            <p><a href="mailto:hello@dompola.ru" className="hover:text-brand">hello@dompola.ru</a></p>
            <p className="text-graphite/65">Архангельск · Северодвинск · Вологда</p>
            <p className="text-graphite/65">Пн–Сб 10:00–20:00, Вс 10:00–18:00</p>
          </div>
          <div className="rounded-3xl bg-mist p-6">
            <h2 className="font-display text-xl font-semibold">Написать нам</h2>
            <div className="mt-4">
              <LeadForm source="contacts" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
