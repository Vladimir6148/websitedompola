import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Compass, Hammer, Store as StoreIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { OfferProductCard } from '../components/OfferProductCard';
import { LeadForm } from '../components/LeadForm';
import { SmartImage } from '../components/SmartImage';
import { PromoCarousel } from '../components/PromoCarousel';
import { api } from '../lib/api';
import type { HomePayload, Product, ProductsResponse, Promotion } from '../types';

const icons: Record<string, ReactNode> = {
  store: <StoreIcon />,
  compass: <Compass />,
  hammer: <Hammer />,
  calculator: <Calculator />,
};

export function HomePage() {
  const [data, setData] = useState<HomePayload | null>(null);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);

  useEffect(() => {
    api<HomePayload>('/api/content/home')
      .then((home) => {
        setData(home);
        if (home.promotions?.length) setPromos(home.promotions);
      })
      .catch(() => undefined);
    api<Promotion[]>('/api/promotions')
      .then(setPromos)
      .catch(() => undefined);
    api<ProductsResponse>('/api/products?limit=24&sort=price_asc')
      .then((res) => {
        const withDiscount = res.items.filter((p) => p.oldPrice && p.oldPrice > p.price);
        const list = (withDiscount.length ? withDiscount : res.items).slice(0, 8);
        setDeals(list);
      })
      .catch(() => undefined);
  }, []);

  const carouselSlides = promos.length ? promos : data?.promotions || [];
  const offerProducts = useMemo(() => deals.slice(0, 8), [deals]);

  return (
    <>
      <Seo
        title="ДОМПОЛА — напольные покрытия"
        description="Кварцвинил, ламинат, линолеум, керамогранит и паркет в Архангельске, Северодвинске и Вологде."
        path="/"
        image={carouselSlides[0]?.image || undefined}
      />

      <PromoCarousel slides={carouselSlides} />

      <section className="container-dp py-12 md:py-16">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <h2 className="section-title">Выгодные предложения</h2>
          <Link to="/catalog" className="text-sm font-semibold text-brand hover:underline">
            Весь каталог
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {offerProducts.map((p) => (
            <OfferProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {(data?.promotions?.length || 0) > 0 ? (
        <section className="bg-mist py-16 md:py-20">
          <div className="container-dp">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="section-title">Акции</h2>
              <Link to="/promotions" className="text-sm font-semibold text-brand hover:underline">
                Все акции
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data!.promotions.map((p) => (
                <Link
                  key={p.id}
                  to="/promotions"
                  className="group relative min-h-[220px] overflow-hidden rounded-2xl"
                >
                  <SmartImage src={p.image} alt={p.title} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-graphite/55" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    {p.discountPercent ? (
                      <span className="mb-2 w-fit rounded-md bg-brand px-2 py-1 text-xs font-bold">−{p.discountPercent}%</span>
                    ) : null}
                    <h3 className="font-display text-2xl font-semibold">{p.title}</h3>
                    <p className="mt-2 max-w-md text-sm text-white/75">{p.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-dp py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="section-title">Популярные товары</h2>
          <Link to="/catalog" className="text-sm font-semibold text-brand hover:underline">
            В каталог
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.featured || []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-graphite py-16 text-white md:py-20">
        <div className="container-dp grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold md:text-5xl">Подбор покрытия за 4 шага</h2>
            <p className="mt-4 max-w-lg text-white/70">
              Укажите помещение, приоритет, тёплый пол и стиль — покажем подходящие позиции из каталога.
            </p>
            <Link to="/picker" className="btn-primary mt-8">
              Запустить подбор
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Помещение', 'Приоритет', 'Тёплый пол', 'Стиль'].map((step, i) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-wide text-brand">Шаг {i + 1}</div>
                <div className="mt-2 font-display text-xl">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-16 md:py-20">
        <h2 className="section-title mb-8">Почему ДОМПОЛА</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(data?.advantages || []).map((a) => (
            <div key={a.id} className="rounded-2xl border border-graphite/8 bg-mist/60 p-6">
              <div className="mb-4 text-brand">{icons[a.icon || ''] || <Compass />}</div>
              <h3 className="font-display text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite/65">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-mist py-16 md:py-20">
        <div className="container-dp">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="section-title">Услуги</h2>
            <Link to="/services" className="text-sm font-semibold text-brand hover:underline">Все услуги</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(data?.services || []).map((s) => (
              <div key={s.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-graphite/65">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="section-title">Наши работы</h2>
          <Link to="/works" className="text-sm font-semibold text-brand hover:underline">Смотреть все</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.works || []).map((w) => (
            <article key={w.id} className="overflow-hidden rounded-2xl">
              <div className="aspect-[4/3] overflow-hidden">
                <SmartImage src={w.image} alt={w.title} className="h-full w-full object-cover" />
              </div>
              <div className="pt-3">
                <h3 className="font-semibold">{w.title}</h3>
                <p className="text-sm text-graphite/55">{[w.city, w.category].filter(Boolean).join(' · ')}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-graphite py-16 text-white md:py-20">
        <div className="container-dp">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Магазины</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(data?.stores || []).map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-brand">{s.city?.name}</div>
                <h3 className="mt-1 font-display text-xl">{s.name}</h3>
                <p className="mt-3 text-sm text-white/70">{s.address}</p>
                <p className="mt-1 text-sm text-white/70">{s.schedule}</p>
                {s.phone ? <a href={`tel:${s.phone}`} className="mt-3 inline-block text-sm text-brand hover:underline">{s.phone}</a> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-16 md:py-20">
        <div className="grid gap-10 rounded-3xl bg-mist p-6 md:grid-cols-2 md:p-10">
          <div>
            <h2 className="section-title">Нужна консультация?</h2>
            <p className="mt-3 text-graphite/65">
              Оставьте заявку — поможем с выбором покрытия, расчётом количества и записью на замер.
            </p>
          </div>
          <LeadForm source="home_consult" />
        </div>
      </section>
    </>
  );
}
