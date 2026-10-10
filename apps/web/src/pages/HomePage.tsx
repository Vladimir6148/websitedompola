import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ClipboardList,
  ExternalLink,
  Grid3x3,
  Hammer,
  Layers,
  MapPin,
  Ruler,
  Store as StoreIcon,
  Sun,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { OfferProductCard } from '../components/OfferProductCard';
import { DEFAULT_HERO_SLIDES, PromoCarousel } from '../components/PromoCarousel';
import { SectionHeader } from '../components/SectionHeader';
import { SITE_NAME, SITE_TAGLINE, Seo } from '../components/Seo';
import { api } from '../lib/api';
import { useCity } from '../store/city';
import type { HomePayload } from '../types';

type IconCmp = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const advantageIcons: Record<string, IconCmp> = {
  store: StoreIcon,
  compass: Compass,
  hammer: Hammer,
  calculator: ClipboardList,
  clipboard: ClipboardList,
};

const serviceIcons: Record<string, IconCmp> = {
  ruler: Ruler,
  layers: Layers,
  trash: Trash2,
  grid: Grid3x3,
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

function mapsUrl(opts: { lat?: number | null; lng?: number | null; address?: string | null }) {
  if (opts.lat != null && opts.lng != null) {
    return `https://yandex.ru/maps/?pt=${opts.lng},${opts.lat}&z=16&l=map`;
  }
  const q = (opts.address || '').trim();
  if (!q) return '/stores';
  return `https://yandex.ru/maps/?text=${encodeURIComponent(q)}`;
}

export function HomePage() {
  const { cityRev } = useCity();
  const [data, setData] = useState<HomePayload | null>(null);

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

    return () => {
      cancelled = true;
    };
  }, [cityRev]);

  const offerProducts = useMemo(() => {
    const fromDeals = data?.deals || [];
    if (fromDeals.length) return fromDeals.slice(0, 8);
    return (data?.featured || []).slice(0, 8);
  }, [data]);
  const related = useMemo(() => (data?.related || []).slice(0, 4), [data]);
  const carouselSlides = DEFAULT_HERO_SLIDES;

  return (
    <>
      <Seo
        title={SITE_NAME}
        description={SITE_TAGLINE}
        path="/"
        image={carouselSlides[0]?.image || undefined}
      />

      <h1 className="sr-only">{SITE_NAME}</h1>
      <p className="sr-only">{SITE_TAGLINE}</p>

      <PromoCarousel slides={carouselSlides} />

      <section className="bg-white">
        <div className="w-full pt-1.5 pb-2 sm:py-2.5 lg:px-6 lg:pt-2 lg:pb-2.5">
          <div className="overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible lg:pb-0">
            <div className="flex w-max min-w-full gap-2 lg:grid lg:w-auto lg:min-w-0 lg:grid-cols-7 lg:gap-2.5">
              {ASSORTMENT.map((item) => (
                <Link
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-brand bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] first:ml-1.5 last:mr-1.5 sm:first:ml-2 sm:last:mr-2 lg:h-[3.25rem] lg:w-full lg:px-2 lg:first:ml-0 lg:last:mr-0 lg:text-center lg:text-[13px] xl:h-14 xl:text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-dp py-4 md:py-6">
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

      <section className="bg-mist py-4 md:py-6">
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
        <section className="container-dp py-4 md:py-6">
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

      {/* Services / Why us / Stores — same panel rhythm */}
      <section className="container-dp space-y-3 py-4 md:space-y-4 md:py-6">
        <div className="rounded-2xl bg-mist p-3 sm:p-4 md:rounded-[1.25rem] md:p-5">
          <SectionHeader
            eyebrow="Всё для вашего пола"
            title="Всё для вашего пола"
            description="От замера до укладки — поможем на каждом этапе."
            action={{ to: '/services', label: 'Все услуги' }}
            actionVariant="outline"
            icon={Sun}
          />
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-4">
            {(data?.services || []).map((s) => {
              const Icon = serviceIcons[s.icon || ''] || Ruler;
              return (
                <Link
                  key={s.id}
                  to={`/services/${s.slug}`}
                  className="relative flex flex-col rounded-xl border border-graphite/8 bg-white p-2.5 sm:p-3"
                >
                  {s.badge ? (
                    <span className="absolute right-1.5 top-1.5 inline-flex items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-brand">
                      {s.badge}
                    </span>
                  ) : null}
                  <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand sm:h-9 sm:w-9">
                    <Icon size={15} strokeWidth={1.75} />
                  </span>
                  <h3 className="font-display text-[12px] font-semibold leading-snug text-graphite sm:text-sm">
                    {s.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 flex-1 text-[10px] leading-snug text-graphite/55 sm:text-xs">
                    {s.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-mist p-3 sm:p-4 md:rounded-[1.25rem] md:p-5">
          <SectionHeader
            eyebrow="Почему мы"
            title="Доверяют ДомПола"
            description="Шоурумы, подбор и монтаж — от образца до готового пола."
            icon={ThumbsUp}
          />
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-4">
            {(data?.advantages || []).map((a) => {
              const Icon = advantageIcons[a.icon || ''] || Compass;
              return (
                <div
                  key={a.id}
                  className="flex flex-col rounded-xl border border-graphite/8 bg-white p-2.5 sm:p-3"
                >
                  <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand sm:h-9 sm:w-9">
                    <Icon size={15} strokeWidth={1.75} />
                  </span>
                  <h3 className="font-display text-[12px] font-semibold leading-snug sm:text-sm">
                    {a.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-graphite/55 sm:text-xs">
                    {a.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-mist p-3 sm:p-4 md:rounded-[1.25rem] md:p-5">
          <SectionHeader
            eyebrow="Наши магазины"
            title="Магазины рядом"
            description="Приходите за образцами и консультацией."
            action={{ to: '/stores', label: 'Все магазины' }}
            actionVariant="solid"
            icon={MapPin}
          />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
            {(data?.stores || []).map((s) => {
              const city = s.city?.name || s.name;
              const directions = mapsUrl({ lat: s.lat, lng: s.lng, address: s.address });
              return (
                <article
                  key={s.id}
                  className="flex flex-col rounded-xl border border-graphite/8 bg-white p-2.5 sm:p-3"
                >
                  <h3 className="font-display text-[12px] font-semibold text-graphite sm:text-sm">
                    {city}
                  </h3>
                  {s.phone ? (
                    <a href={`tel:${s.phone}`} className="mt-0.5 text-[10px] font-medium text-brand sm:text-xs">
                      {s.phone}
                    </a>
                  ) : null}
                  {s.address ? (
                    <a
                      href={directions}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 flex flex-1 items-start gap-1 text-[10px] leading-snug text-graphite/65 sm:text-xs"
                    >
                      <MapPin size={12} className="mt-0.5 shrink-0 text-brand" strokeWidth={2} />
                      <span className="line-clamp-2">{s.address}</span>
                    </a>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <a
                    href={directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand sm:text-xs"
                  >
                    На карте
                    <ExternalLink size={11} strokeWidth={2.25} />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
