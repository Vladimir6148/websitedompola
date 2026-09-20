import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Layers, PanelBottom, Pipette, SlidersHorizontal, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import type { Brand, Category, ProductsResponse } from '../types';

const ACCESSORY_SLUGS = ['underlayment', 'baseboards', 'accessories'] as const;

const ACCESSORY_CHIPS = [
  { slug: 'underlayment', label: 'Подложка', icon: Layers, to: '/catalog/underlayment' },
  { slug: 'baseboards', label: 'Плинтус', icon: PanelBottom, to: '/catalog/baseboards' },
  { slug: 'accessories', label: 'Клей', icon: Pipette, to: '/catalog/accessories?chip=glue' },
] as const;

function productWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
  return 'товаров';
}

export function CatalogPage() {
  const { categorySlug } = useParams();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const productsTopRef = useRef<HTMLDivElement>(null);
  const shouldScrollToProducts = useRef(false);

  const q = params.get('q') || '';
  const brand = params.get('brand') || '';
  const sort = params.get('sort') || 'newest';
  const page = params.get('page') || '1';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const wearClass = params.get('wearClass') || '';
  const moistureResistant = params.get('moistureResistant') || '';
  const underfloorHeating = params.get('underfloorHeating') || '';
  const accessoryChip = params.get('chip') || '';
  const prevPageRef = useRef(page);

  const inAccessorySection = Boolean(
    categorySlug && ACCESSORY_SLUGS.includes(categorySlug as (typeof ACCESSORY_SLUGS)[number]),
  );
  const accessoryHub = categorySlug === 'accessories' && accessoryChip !== 'glue';
  const categoryQuery = accessoryHub
    ? 'underlayment,baseboards,accessories'
    : categorySlug || '';

  const activeFilters = [
    q,
    brand,
    minPrice,
    maxPrice,
    wearClass,
    moistureResistant,
    underfloorHeating,
  ].filter(Boolean).length;

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug],
  );

  const pageTitle = accessoryHub
    ? 'Комплектующие'
    : categorySlug === 'accessories' && accessoryChip === 'glue'
      ? 'Клей'
      : activeCategory?.name || 'Каталог';

  useEffect(() => {
    Promise.all([api<Category[]>('/api/categories'), api<Brand[]>('/api/brands')]).then(
      ([cats, br]) => {
        setCategories(cats);
        setBrands(br);
      },
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (brand) qs.set('brand', brand);
    if (sort) qs.set('sort', sort);
    if (page) qs.set('page', page);
    if (minPrice) qs.set('minPrice', minPrice);
    if (maxPrice) qs.set('maxPrice', maxPrice);
    if (wearClass) qs.set('wearClass', wearClass);
    if (moistureResistant) qs.set('moistureResistant', moistureResistant);
    if (underfloorHeating) qs.set('underfloorHeating', underfloorHeating);

    let cancelled = false;

    if (accessoryHub) {
      Promise.all(
        ACCESSORY_SLUGS.map((slug) => {
          const part = new URLSearchParams(qs);
          part.set('category', slug);
          part.set('limit', '48');
          part.delete('page');
          return api<ProductsResponse>(`/api/products?${part}`);
        }),
      )
        .then((parts) => {
          if (cancelled) return;
          const seen = new Set<string>();
          const items = parts.flatMap((p) => p.items || []).filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          const pageNum = Math.max(1, Number(page) || 1);
          const limit = 12;
          const start = (pageNum - 1) * limit;
          setData({
            items: items.slice(start, start + limit),
            total: items.length,
            page: pageNum,
            limit,
            pages: Math.ceil(items.length / limit) || 1,
          });
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      if (categoryQuery) qs.set('category', categoryQuery);
      qs.set('limit', '12');
      api<ProductsResponse>(`/api/products?${qs}`)
        .then((res) => {
          if (!cancelled) setData(res);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [accessoryHub, categoryQuery, q, brand, sort, page, minPrice, maxPrice, wearClass, moistureResistant, underfloorHeating]);

  useEffect(() => {
    if (prevPageRef.current !== page) {
      shouldScrollToProducts.current = true;
      prevPageRef.current = page;
    }
  }, [page]);

  useEffect(() => {
    if (loading || !shouldScrollToProducts.current) return;
    shouldScrollToProducts.current = false;
    productsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, data]);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    ['q', 'brand', 'minPrice', 'maxPrice', 'wearClass', 'moistureResistant', 'underfloorHeating'].forEach(
      (key) => next.delete(key),
    );
    next.delete('page');
    setParams(next);
  }

  const filterPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-graphite/10 px-5 py-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-graphite">Фильтры</h2>
          {activeFilters ? (
            <p className="mt-0.5 text-xs text-graphite/50">Выбрано: {activeFilters}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          aria-label="Закрыть"
          className="grid h-9 w-9 place-items-center rounded-full text-graphite transition hover:bg-mist"
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">
            Поиск
          </label>
          <input
            value={q}
            onChange={(e) => update('q', e.target.value)}
            placeholder="Название или артикул"
            className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">
            Бренд
          </label>
          <select
            value={brand}
            onChange={(e) => update('brand', e.target.value)}
            className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm"
          >
            <option value="">Любой</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">
              Цена от
            </label>
            <input
              value={minPrice}
              onChange={(e) => update('minPrice', e.target.value)}
              inputMode="numeric"
              className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">
              до
            </label>
            <input
              value={maxPrice}
              onChange={(e) => update('maxPrice', e.target.value)}
              inputMode="numeric"
              className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">
            Класс
          </label>
          <input
            value={wearClass}
            onChange={(e) => update('wearClass', e.target.value)}
            placeholder="32 / 33 / 43"
            className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={moistureResistant === '1'}
            onChange={(e) => update('moistureResistant', e.target.checked ? '1' : '')}
          />
          Влагостойкость
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={underfloorHeating === '1'}
            onChange={(e) => update('underfloorHeating', e.target.checked ? '1' : '')}
          />
          Тёплый пол
        </label>
      </div>

      <div className="flex gap-2 border-t border-graphite/10 px-5 py-4">
        <button
          type="button"
          onClick={clearFilters}
          className="flex-1 rounded-md border border-graphite/15 px-4 py-2.5 text-sm font-semibold text-graphite transition hover:border-brand hover:text-brand"
        >
          Сбросить
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="btn-primary flex-1 !rounded-md !py-2.5"
        >
          Показать
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Seo
        title={pageTitle}
        description={activeCategory?.description || 'Каталог напольных покрытий ДОМПОЛА'}
        path={categorySlug ? `/catalog/${categorySlug}` : '/catalog'}
      />

      <div className="container-dp py-8 md:py-12">
        <nav className="mb-4 text-sm text-graphite/50">
          <Link to="/" className="hover:text-brand">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link to="/catalog" className="hover:text-brand">
            Каталог
          </Link>
          {inAccessorySection ? (
            <>
              <span className="mx-2">/</span>
              <Link to="/catalog/accessories" className="hover:text-brand">
                Комплектующие
              </Link>
              {!accessoryHub ? (
                <>
                  <span className="mx-2">/</span>
                  <span>{pageTitle}</span>
                </>
              ) : null}
            </>
          ) : activeCategory ? (
            <>
              <span className="mx-2">/</span>
              <span>{activeCategory.name}</span>
            </>
          ) : null}
        </nav>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="section-title">{pageTitle}</h1>
            <p className="mt-2 text-graphite/60">
              {loading ? 'Загрузка…' : `${data?.total ?? 0} ${productWord(data?.total ?? 0)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Открыть фильтры"
              className="relative inline-flex h-10 items-center gap-2 rounded-md border border-graphite/15 bg-white px-3 text-sm font-semibold text-graphite transition hover:border-brand hover:text-brand"
            >
              <SlidersHorizontal size={18} />
              <span>Фильтры</span>
              {activeFilters > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                  {activeFilters}
                </span>
              ) : null}
            </button>
            <select
              value={sort}
              onChange={(e) => update('sort', e.target.value)}
              className="h-10 rounded-md border border-graphite/15 bg-white px-3 text-sm"
            >
              <option value="newest">Сначала новые</option>
              <option value="price_asc">Цена ↑</option>
              <option value="price_desc">Цена ↓</option>
              <option value="name">По названию</option>
              <option value="popular">Популярные</option>
            </select>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {inAccessorySection ? (
            <>
              <Link
                to="/catalog/accessories"
                className={`inline-flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  accessoryHub
                    ? 'border-brand bg-brand text-white'
                    : 'border-graphite/12 bg-white text-graphite hover:border-brand hover:text-brand'
                }`}
              >
                <span className="text-xs font-medium opacity-80">Все</span>
              </Link>
              {ACCESSORY_CHIPS.map((chip) => {
                const Icon = chip.icon;
                const active =
                  chip.slug === 'accessories'
                    ? categorySlug === 'accessories' && accessoryChip === 'glue'
                    : categorySlug === chip.slug;
                return (
                  <Link
                    key={chip.slug}
                    to={chip.to}
                    className={`inline-flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? 'border-brand bg-brand text-white'
                        : 'border-graphite/12 bg-white text-graphite hover:border-brand hover:text-brand'
                    }`}
                  >
                    <Icon size={22} strokeWidth={1.75} />
                    <span>{chip.label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              <Link
                to="/catalog"
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${!categorySlug ? 'bg-brand text-white' : 'bg-mist text-graphite'}`}
              >
                Все
              </Link>
              {categories
                .filter((c) => !ACCESSORY_SLUGS.includes(c.slug as (typeof ACCESSORY_SLUGS)[number]))
                .map((c) => (
                  <Link
                    key={c.id}
                    to={`/catalog/${c.slug}`}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${categorySlug === c.slug ? 'bg-brand text-white' : 'bg-mist text-graphite'}`}
                  >
                    {c.name}
                  </Link>
                ))}
              <Link
                to="/catalog/accessories"
                className="whitespace-nowrap rounded-full bg-mist px-4 py-2 text-sm text-graphite"
              >
                Комплектующие
              </Link>
            </>
          )}
        </div>

        <div ref={productsTopRef} className="scroll-mt-28">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-mist" />
              ))}
            </div>
          ) : data?.items?.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {data.pages > 1 ? (
                <div className="mt-8 flex flex-wrap gap-2">
                  {Array.from({ length: data.pages }).map((_, i) => {
                    const n = String(i + 1);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update('page', n)}
                        className={`min-w-10 rounded-md px-3 py-2 text-sm ${page === n ? 'bg-brand text-white' : 'bg-mist'}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-graphite/15 p-10 text-center text-graphite/60">
              Ничего не найдено. Измените фильтры или запрос.
            </div>
          )}
        </div>
      </div>

      {filtersOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Фильтры">
              <button
                type="button"
                className="absolute inset-0 bg-ink/55"
                aria-label="Закрыть"
                onClick={() => setFiltersOpen(false)}
              />
              <div className="absolute inset-y-0 right-0 flex h-full w-[90%] max-w-sm bg-white shadow-2xl">
                {filterPanel}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
