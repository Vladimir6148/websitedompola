import { useEffect, useState } from 'react';
import { Seo } from '../components/Seo';
import { LeadForm } from '../components/LeadForm';
import { SmartImage } from '../components/SmartImage';
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
              {p.image ? <SmartImage src={p.image} alt={p.title} className="aspect-[16/9] w-full object-cover" /> : null}
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
              <SmartImage src={w.image} alt={w.title} className="aspect-[4/3] w-full rounded-2xl object-cover" />
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

  const withCoords = items.filter((s) => s.lat != null && s.lng != null);
  const mapSrc = (() => {
    if (!withCoords.length) return null;
    const avgLng = withCoords.reduce((sum, s) => sum + Number(s.lng), 0) / withCoords.length;
    const avgLat = withCoords.reduce((sum, s) => sum + Number(s.lat), 0) / withCoords.length;
    const points = withCoords.map((s) => `${s.lng},${s.lat},pm2rdm`).join('~');
    return `https://yandex.ru/map-widget/v1/?ll=${avgLng},${avgLat}&z=5&l=map&pt=${points}`;
  })();

  return (
    <>
      <Seo title="Магазины" path="/stores" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Магазины</h1>
        <p className="mt-3 text-graphite/60">Магазины ДОМПОЛА — адреса на карте и в списке ниже.</p>

        {mapSrc ? (
          <div id="map" className="mt-6 overflow-hidden rounded-2xl border border-graphite/10 bg-mist">
            <iframe
              title="Карта салонов ДОМПОЛА"
              src={mapSrc}
              className="h-[280px] w-full border-0 sm:h-[380px] md:h-[440px]"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((s) => (
            <article key={s.id} className="rounded-2xl border border-graphite/8 p-5">
              <div className="text-sm text-brand">{s.city?.name}</div>
              <h2 className="mt-1 font-display text-xl font-semibold">{s.name}</h2>
              <p className="mt-3 text-sm">{s.address}</p>
              <p className="text-sm text-graphite/60">{s.schedule}</p>
              {s.phone ? (
                <a className="mt-3 inline-block text-brand" href={`tel:${s.phone}`}>
                  {s.phone}
                </a>
              ) : null}
              {s.lat != null && s.lng != null ? (
                <a
                  className="mt-3 block text-sm font-medium text-graphite/70 underline-offset-2 hover:text-brand hover:underline"
                  href={`https://yandex.ru/maps/?pt=${s.lng},${s.lat}&z=16&l=map`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть на Яндекс.Картах
                </a>
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
          <div className="space-y-5 text-base sm:text-lg">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Архангельск</p>
              <p className="mt-1 text-graphite/80">ТЦ «Новосёл», Московский проспект, 25, корп. 4, стр. 1</p>
              <a href="tel:+79214994979" className="mt-1 inline-block font-semibold hover:text-brand">
                +7 (921) 499-49-79
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Северодвинск</p>
              <p className="mt-1 text-graphite/80">ул. Южная, 4</p>
              <a href="tel:+79212494979" className="mt-1 inline-block font-semibold hover:text-brand">
                +7 (921) 249-49-79
              </a>
              <p className="mt-1 text-sm text-graphite/55">Пн–Пт 11:00–19:00, Сб–Вс 11:00–18:00</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Вологда</p>
              <p className="mt-1 text-graphite/80">ул. Чернышевского, 97А</p>
            </div>
            <p>
              <a href="mailto:dompola29@mail.ru" className="hover:text-brand">
                dompola29@mail.ru
              </a>
            </p>
            <p className="text-graphite/65">Пн–Сб 10:00–20:00, Вс 10:00–18:00</p>
          </div>
          <div className="rounded-3xl bg-mist p-6">
            <h2 className="font-display text-xl font-semibold">Написать нам</h2>
            <div className="mt-4">
              <LeadForm source="contacts" submitLabel="Отправить сообщение" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
