import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Calculator, Hammer, Store as StoreIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { OfferProductCard } from '../components/OfferProductCard';
import { DEFAULT_HERO_SLIDES, PromoCarousel } from '../components/PromoCarousel';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../lib/api';
import type { HomePayload, Product, ProductsResponse } from '../types';

const icons: Record<string, ReactNode> = {
  store: <StoreIcon />,
  compass: <Compass />,
  hammer: <Hammer />,
  calculator: <Calculator />,
};

/** Flooring assortment chips after hero (short labels) — useful on mobile without sidebar */
const ASSORTMENT = [
  { to: '/catalog/laminate', label: 'Ламинат' },
  { to: '/catalog/quartzvinyl-spc', label: 'Кварцвинил SPC' },
  { to: '/catalog/mspc', label: 'MSPC' },
  { to: '/catalog/linoleum', label: 'Линолеум' },
  { to: '/catalog/porcelain', label: 'Керамогранит' },
  { to: '/catalog/parquet', label: 'Паркет' },
  { to: '/catalog/accessories', label: 'Комплектующие' },
];


export function HomePage() {
  const [data, setData] = useState<HomePayload | null>(null);
  const [deals, setDeals] = useState<Product[]>([]);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;

    api<HomePayload>('/api/content/home')
      .then((home) => {
        if (cancelled) return;
        setData({
          ...home,
          advantages: (home.advantages || []).map((a) =>
            /трёх городах|трех городах/i.test(a.title)
              ? { ...a, title: 'Шоурумы с живыми образцами' }
              : a,
          ),
        });
      })
      .catch(() => undefined);

    api<ProductsResponse>(
      '/api/products?limit=48&sort=popular&category=laminate,quartzvinyl-spc,mspc,porcelain,parquet,linoleum',
    )
      .then((res) => {
        const items = res.items || [];
        const withDiscount = items.filter((p) => p.oldPrice && p.oldPrice > p.price);
        const featured = items.filter((p) => p.featured);
        const seen = new Set<string>();
        const list: Product[] = [];
        for (const p of [...withDiscount, ...featured, ...items]) {
          if (!p?.id || seen.has(p.id)) continue;
          seen.add(p.id);
          list.push(p);
          if (list.length >= 8) break;
        }
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

  const offerProducts = useMemo(() => deals.slice(0, 8), [deals]);
  const carouselSlides = DEFAULT_HERO_SLIDES;

  return (
    <>
      <Seo
        title="ДОМПОЛА — напольные покрытия"
        description="Кварцвинил, ламинат, линолеум, керамогранит и паркет в Архангельске, Северодвинске и Вологде."
        path="/"
        image={carouselSlides[0]?.image || undefined}
      />

      <PromoCarousel slides={carouselSlides} />

      <section className="bg-white">
        <div className="w-full px-4 py-2.5 sm:px-5 sm:py-3 md:px-5 lg:px-6 lg:py-3.5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 lg:gap-2.5">
            {ASSORTMENT.map((item) => (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-brand bg-brand px-2 text-center text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] lg:h-[3.25rem] lg:px-2 lg:text-[13px] xl:h-14 xl:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-6 md:py-10">
        <SectionHeader
          eyebrow="Скидки недели"
          title="Выгодные предложения"
          description="Актуальные цены на покрытия со скидкой"
          action={{ to: '/catalog', label: 'Весь каталог' }}
        />
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
          {offerProducts.map((p, i) => (
            <OfferProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </section>

      <section className="bg-mist py-6 md:py-10">
        <div className="container-dp">
          <SectionHeader
            eyebrow="Выбор покупателей"
            title="Популярные товары"
            description="Проверенные коллекции, которые чаще всего покупают"
            action={{ to: '/catalog', label: 'В каталог' }}
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
            {(data?.featured || []).slice(0, 8).map((p, i) => (
              <OfferProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="container-dp py-6 md:py-10">
          <SectionHeader
            eyebrow="К монтажу покрытия"
            title="Подложка, плинтус и клей"
            description="Сопутствующие материалы для ровной укладки и аккуратного финиша."
            action={{ to: '/catalog/accessories', label: 'Все комплектующие' }}
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <OfferProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-mist py-6 md:py-10">
        <div className="container-dp">
          <SectionHeader
            eyebrow="Сервис"
            title="Услуги"
            description="Замер, укладка и расчёт материалов — без лишней суеты."
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {(data?.services || []).map((s) => (
              <div key={s.id} className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-graphite/5 sm:p-5">
                <h3 className="font-display text-sm font-semibold leading-snug sm:text-base">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-graphite/65 sm:mt-2 sm:text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-6 md:py-10">
        <SectionHeader
          eyebrow="Почему мы"
          title="Доверяют ДОМПОЛА"
          description="Шоурумы, подбор под задачу и монтаж — от образца до готового пола."
        />
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {(data?.advantages || []).map((a) => (
            <div key={a.id} className="rounded-xl border border-graphite/8 bg-mist/60 p-3.5 sm:p-5">
              <div className="mb-2 text-brand sm:mb-3">{icons[a.icon || ''] || <Compass />}</div>
              <h3 className="font-display text-sm font-semibold leading-snug sm:text-base">{a.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-graphite/65 sm:mt-2 sm:text-sm">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-graphite/8 bg-mist py-5 md:py-8">
        <div className="container-dp">
          <SectionHeader
            eyebrow="Где купить"
            title="Магазины"
            description="Приходите за образцами в наши магазины."
            action={{ to: '/stores', label: 'Все магазины' }}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(data?.stores || []).map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-0.5 rounded-xl border border-graphite/8 bg-white px-3.5 py-3 sm:px-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-sm font-semibold text-graphite sm:text-base">{s.city?.name || s.name}</h3>
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
