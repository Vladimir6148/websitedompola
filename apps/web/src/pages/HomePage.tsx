import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Calculator, Hammer, Store as StoreIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { OfferProductCard } from '../components/OfferProductCard';
import { SmartImage } from '../components/SmartImage';
import { PromoCarousel } from '../components/PromoCarousel';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../lib/api';
import type { HomePayload, Product, ProductsResponse, Promotion } from '../types';
import initialPromotions from '../data/promotions.json';

const icons: Record<string, ReactNode> = {
  store: <StoreIcon />,
  compass: <Compass />,
  hammer: <Hammer />,
  calculator: <Calculator />,
};

export function HomePage() {
  const [data, setData] = useState<HomePayload | null>(null);
  const [promos, setPromos] = useState<Promotion[]>(initialPromotions as Promotion[]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;

    api<HomePayload>('/api/content/home')
      .then((home) => {
        if (cancelled) return;
        setData(home);
        if (home.promotions?.length) setPromos(home.promotions);
      })
      .catch(() => undefined);

    api<Promotion[]>('/api/promotions')
      .then((list) => {
        if (!cancelled && list?.length) setPromos(list);
      })
      .catch(() => undefined);

    api<ProductsResponse>('/api/products?limit=24&sort=price_asc')
      .then((res) => {
        const withDiscount = res.items.filter((p) => p.oldPrice && p.oldPrice > p.price);
        const list = (withDiscount.length ? withDiscount : res.items).slice(0, 8);
        if (!cancelled) setDeals(list);
      })
      .catch(() => undefined);

    Promise.all([
      api<ProductsResponse>('/api/products?category=underlayment&limit=4'),
      api<ProductsResponse>('/api/products?category=baseboards&limit=4'),
      api<ProductsResponse>('/api/products?category=accessories&limit=4'),
    ])
      .then(([under, base, acc]) => {
        if (cancelled) return;
        const preferred = [
          'podlozhka-xps-3mm',
          'plintus-pvh-dub-natural',
          'klej-dlya-spc',
          'podlozhka-khvoynaya-7mm',
          'plintus-mdf-belyj-80',
        ];
        const pool = [...(under.items || []), ...(base.items || []), ...(acc.items || [])];
        const bySlug = new Map(pool.map((p) => [p.slug, p]));
        const ordered = preferred.map((s) => bySlug.get(s)).filter(Boolean) as Product[];
        const rest = pool.filter((p) => !preferred.includes(p.slug));
        setRelated([...ordered, ...rest].slice(0, 4));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
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
        <SectionHeader
          eyebrow="Скидки недели"
          title="Выгодные предложения"
          description="Актуальные цены на покрытия со скидкой"
          action={{ to: '/catalog', label: 'Весь каталог' }}
        />
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {offerProducts.map((p) => (
            <OfferProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-mist py-12 md:py-16">
        <div className="container-dp">
          <SectionHeader
            eyebrow="Выбор покупателей"
            title="Популярные товары"
            description="Проверенные коллекции, которые чаще всего покупают"
            action={{ to: '/catalog', label: 'В каталог' }}
          />
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {(data?.featured || []).slice(0, 8).map((p) => (
              <OfferProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="container-dp py-12 md:py-16">
          <SectionHeader
            eyebrow="К монтажу покрытия"
            title="Подложка, плинтус и клей"
            description="Сопутствующие материалы для ровной укладки и аккуратного финиша."
            action={{ to: '/catalog/accessories', label: 'Все комплектующие' }}
          />
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <OfferProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-mist py-12 md:py-16">
        <div className="container-dp">
          <SectionHeader
            eyebrow="Сервис"
            title="Услуги"
            description="Замер, укладка и расчёт материалов — без лишней суеты."
            action={{ to: '/services', label: 'Все услуги' }}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(data?.services || []).map((s) => (
              <div key={s.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-graphite/5">
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-graphite/65">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-12 md:py-16">
        <SectionHeader
          eyebrow="Почему мы"
          title="Доверяют ДОМПОЛА"
          description="Шоурумы, подбор под задачу и монтаж — от образца до готового пола."
        />
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

      <section className="container-dp py-12 md:py-16">
        <SectionHeader
          eyebrow="Портфолио"
          title="Наши работы"
          description="Реальные объекты в Архангельске, Северодвинске и Вологде."
          action={{ to: '/works', label: 'Смотреть все' }}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.works || []).map((w) => (
            <article key={w.id} className="overflow-hidden rounded-2xl">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
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

      <section className="border-t border-graphite/8 bg-mist py-8 md:py-10">
        <div className="container-dp">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">Где купить</p>
              <h2 className="font-display text-2xl font-bold text-graphite md:text-3xl">Магазины</h2>
            </div>
            <Link to="/stores" className="text-sm font-semibold text-brand hover:underline">
              Все магазины →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(data?.stores || []).map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-0.5 rounded-xl border border-graphite/8 bg-white px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-graphite">{s.city?.name || s.name}</h3>
                  {s.phone ? (
                    <a href={`tel:${s.phone}`} className="shrink-0 text-xs font-medium text-brand hover:underline">
                      {s.phone}
                    </a>
                  ) : null}
                </div>
                <p className="text-sm text-graphite/65">{s.address}</p>
                {s.schedule ? <p className="text-xs text-graphite/45">{s.schedule}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
