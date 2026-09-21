import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layers, PanelBottom, Pipette, Search, SlidersHorizontal, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import type { Brand, Category, Product, ProductsResponse } from '../types';

const ACCESSORY_SLUGS = ['underlayment', 'baseboards', 'accessories'] as const;

const ACCESSORY_CHIPS = [
  { slug: 'underlayment', label: 'Подложка', icon: Layers, to: '/catalog/underlayment' },
  { slug: 'baseboards', label: 'Плинтус', icon: PanelBottom, to: '/catalog/baseboards' },
  { slug: 'accessories', label: 'Клей', icon: Pipette, to: '/catalog/accessories?chip=glue' },
] as const;

const WEAR_CLASS_OPTIONS = ['31', '32', '33', '34', '41', '42', '43'];
const BRAND_PREVIEW = 6;
const COLLECTION_PREVIEW = 5;
/** Max product cards per catalog page (everywhere). */
const PAGE_SIZE = 90;

type CatalogCollection = {
  id: string;
  name: string;
  slug: string;
  brandId: string;
};

function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push('…');
    out.push(sorted[i]!);
  }
  return out;
}

function productWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
  return 'товаров';
}

function parseList(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinList(values: string[]) {
  return values.filter(Boolean).join(',');
}

type OptionItem = { slug: string; name: string };

function chipClass(active: boolean, tone: 'neutral' | 'accent' = 'neutral') {
  if (active) {
    return 'whitespace-nowrap rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(31,138,61,0.22)] transition';
  }
  if (tone === 'accent') {
    return 'whitespace-nowrap rounded-full border border-brand/25 bg-brand/[0.06] px-3.5 py-1.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white';
  }
  return 'whitespace-nowrap rounded-full border border-graphite/10 bg-white px-3.5 py-1.5 text-sm font-medium text-graphite/80 transition hover:border-brand/35 hover:text-brand';
}

function OptionPickerModal({
  title,
  options,
  selected,
  onClose,
  onApply,
  applyLabel,
  searchPlaceholder = 'Поиск',
}: {
  title: string;
  options: OptionItem[];
  selected: string[];
  onClose: () => void;
  onApply: (next: string[]) => void;
  applyLabel: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>(selected);

  useEffect(() => {
    setDraft(selected);
  }, [selected]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(slug: string) {
    setDraft((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-ink/55" aria-label="Закрыть" onClick={onClose} />
      <div className="absolute inset-x-3 top-[12%] mx-auto flex max-h-[76vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-[28rem] sm:-translate-x-1/2">
        <div className="flex items-center justify-between border-b border-graphite/10 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-graphite">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="grid h-8 w-8 place-items-center rounded-full text-graphite hover:bg-mist"
          >
            <X size={18} />
          </button>
        </div>
        <div className="border-b border-graphite/8 px-4 py-3">
          <label className="flex items-center gap-2 rounded-xl border border-graphite/15 px-3 py-2.5">
            <Search size={16} className="shrink-0 text-graphite/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-graphite/40"
            />
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 [scrollbar-width:thin] [scrollbar-color:rgba(15,92,40,0.28)_transparent]">
          {filtered.length ? (
            filtered.map((o) => {
              const checked = draft.includes(o.slug);
              return (
                <label
                  key={o.slug}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-graphite hover:bg-mist"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(o.slug)}
                    className="h-4 w-4 accent-[var(--color-brand)]"
                  />
                  <span className={checked ? 'font-semibold text-brand' : ''}>{o.name}</span>
                </label>
              );
            })
          ) : (
            <p className="px-3 py-6 text-center text-sm text-graphite/50">Ничего не найдено</p>
          )}
        </div>
        <div className="border-t border-graphite/10 p-3">
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="btn-primary w-full"
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CompactChipRow({
  label,
  items,
  selected,
  preview,
  allLabel,
  onSelectOne,
  onClear,
  onOpenMore,
}: {
  label: string;
  items: OptionItem[];
  selected: string[];
  preview: number;
  allLabel: string;
  onSelectOne: (slug: string) => void;
  onClear: () => void;
  onOpenMore: () => void;
}) {
  const selectedSet = new Set(selected);
  const selectedItems = items.filter((i) => selectedSet.has(i.slug));
  const otherItems = items.filter((i) => !selectedSet.has(i.slug));
  const visible = [...selectedItems, ...otherItems].slice(0, Math.max(preview, selectedItems.length));
  const visibleSlugs = new Set(visible.map((i) => i.slug));
  const rest = Math.max(0, items.length - visibleSlugs.size);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-graphite/50">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button type="button" onClick={onClear} className={chipClass(selected.length === 0)}>
          {allLabel}
        </button>
        {visible.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => onSelectOne(item.slug)}
            className={chipClass(selected.includes(item.slug))}
          >
            {item.name}
          </button>
        ))}
        {rest > 0 ? (
          <button type="button" onClick={onOpenMore} className={chipClass(false, 'accent')}>
            + ещё {rest}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CatalogPage() {
  const { categorySlug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allCollections, setAllCollections] = useState<CatalogCollection[]>([]);
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [categoryPool, setCategoryPool] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const productsTopRef = useRef<HTMLDivElement>(null);
  const shouldScrollToProducts = useRef(false);

  const q = params.get('q') || '';
  const brand = params.get('brand') || '';
  const collection = params.get('collection') || '';
  const sort = params.get('sort') || 'newest';
  const page = params.get('page') || '1';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const wearClass = params.get('wearClass') || '';
  const accessoryChip = params.get('chip') || '';
  const prevPageRef = useRef(page);

  const brandSlugs = useMemo(() => parseList(brand), [brand]);
  const collectionSlugs = useMemo(() => parseList(collection), [collection]);

  const inAccessorySection = Boolean(
    categorySlug && ACCESSORY_SLUGS.includes(categorySlug as (typeof ACCESSORY_SLUGS)[number]),
  );
  const accessoryHub = categorySlug === 'accessories' && accessoryChip !== 'glue';
  const categoryQuery = accessoryHub
    ? 'underlayment,baseboards,accessories'
    : categorySlug || '';

  const activeFilters = [q, brand, collection, minPrice, maxPrice, wearClass].filter(Boolean).length;

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
    Promise.all([
      api<Category[]>('/api/categories'),
      api<Brand[]>('/api/brands'),
      api<CatalogCollection[]>('/api/collections').catch(() => [] as CatalogCollection[]),
    ]).then(([cats, br, cols]) => {
      setCategories(cats);
      setBrands(br);
      setAllCollections(cols);
    });
  }, []);

  useEffect(() => {
    if (!categoryQuery || accessoryHub || inAccessorySection) {
      setCategoryPool([]);
      return;
    }
    let cancelled = false;
    const qs = new URLSearchParams();
    qs.set('category', categoryQuery);
    qs.set('limit', '2000');
    api<ProductsResponse>(`/api/products?${qs}`)
      .then((res) => {
        if (!cancelled) setCategoryPool(res.items || []);
      })
      .catch(() => {
        if (!cancelled) setCategoryPool([]);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryQuery, accessoryHub, inAccessorySection]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (brand) qs.set('brand', brand);
    if (collection) qs.set('collection', collection);
    if (sort) qs.set('sort', sort);
    if (page) qs.set('page', page);
    if (minPrice) qs.set('minPrice', minPrice);
    if (maxPrice) qs.set('maxPrice', maxPrice);
    if (wearClass) qs.set('wearClass', wearClass);

    let cancelled = false;

    if (accessoryHub) {
      Promise.all(
        ACCESSORY_SLUGS.map((slug) => {
          const part = new URLSearchParams(qs);
          part.set('category', slug);
          part.set('limit', '2000');
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
          const limit = PAGE_SIZE;
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
      qs.set('limit', String(PAGE_SIZE));
      api<ProductsResponse>(`/api/products?${qs}`)
        .then((res) => {
          if (!cancelled) {
            // Hard cap cards per page even if API returns more
            const items = (res.items || []).slice(0, PAGE_SIZE);
            setData({
              ...res,
              items,
              limit: PAGE_SIZE,
              pages: Math.ceil((res.total || 0) / PAGE_SIZE) || 1,
            });
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [accessoryHub, categoryQuery, q, brand, collection, sort, page, minPrice, maxPrice, wearClass]);

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

  const brandChips = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of categoryPool) {
      if (p.brand?.slug && p.brand?.name) map.set(p.brand.slug, p.brand.name);
    }
    if (map.size) {
      return [...map.entries()]
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }
    return brands
      .filter((b) => b.active !== false)
      .map((b) => ({ slug: b.slug, name: b.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [categoryPool, brands]);

  const collectionChips = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of categoryPool) {
      if (brandSlugs.length && !brandSlugs.includes(p.brand?.slug || '')) continue;
      if (p.collection?.slug && p.collection?.name) {
        map.set(p.collection.slug, p.collection.name);
      }
    }
    if (map.size) {
      return [...map.entries()]
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }
    const brandIds = brandSlugs.length
      ? new Set(brands.filter((b) => brandSlugs.includes(b.slug)).map((b) => b.id))
      : null;
    return allCollections
      .filter((c) => !brandIds || brandIds.has(c.brandId))
      .map((c) => ({ slug: c.slug, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [categoryPool, brandSlugs, brands, allCollections]);

  const collectionGroups = useMemo(() => {
    // Group grid by collection only when a brand is narrowed (keeps "Все" view flat).
    if (!brandSlugs.length) return [];
    const items = data?.items || [];
    const map = new Map<string, typeof items>();
    for (const p of items) {
      const key = p.collection?.name || 'Прочее';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ru'));
  }, [data, brandSlugs]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  function setBrandList(slugs: string[]) {
    const next = new URLSearchParams(params);
    const value = joinList(slugs);
    if (!value) next.delete('brand');
    else next.set('brand', value);
    // Keep only collections that still exist for the selected brand scope
    if (collectionSlugs.length) {
      const allowed = new Set<string>();
      for (const p of categoryPool) {
        if (slugs.length && !slugs.includes(p.brand?.slug || '')) continue;
        if (p.collection?.slug) allowed.add(p.collection.slug);
      }
      const kept = collectionSlugs.filter((s) => allowed.has(s));
      if (!kept.length) next.delete('collection');
      else next.set('collection', joinList(kept));
    }
    next.delete('page');
    setParams(next);
  }

  function setCollectionList(slugs: string[]) {
    update('collection', joinList(slugs));
  }

  function toggleBrandChip(slug: string) {
    if (brandSlugs.includes(slug) && brandSlugs.length === 1) {
      setBrandList([]);
      return;
    }
    setBrandList([slug]);
  }

  function toggleCollectionChip(slug: string) {
    if (collectionSlugs.includes(slug) && collectionSlugs.length === 1) {
      setCollectionList([]);
      return;
    }
    setCollectionList([slug]);
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    ['q', 'brand', 'collection', 'minPrice', 'maxPrice', 'wearClass', 'chip'].forEach(
      (key) => next.delete(key),
    );
    next.delete('page');
    const qs = next.toString();
    navigate(qs ? `/catalog?${qs}` : '/catalog');
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

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
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

        {brandChips.length > 0 ? (
          <CompactChipRow
            label="Производитель / бренд"
            items={brandChips}
            selected={brandSlugs}
            preview={BRAND_PREVIEW}
            allLabel="Все бренды"
            onClear={() => setBrandList([])}
            onSelectOne={toggleBrandChip}
            onOpenMore={() => setBrandModalOpen(true)}
          />
        ) : null}

        {collectionChips.length > 0 ? (
          <CompactChipRow
            label="Коллекция"
            items={collectionChips}
            selected={collectionSlugs}
            preview={COLLECTION_PREVIEW}
            allLabel="Все коллекции"
            onClear={() => setCollectionList([])}
            onSelectOne={toggleCollectionChip}
            onOpenMore={() => setCollectionModalOpen(true)}
          />
        ) : (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">
              Коллекция
            </label>
            <p className="text-sm text-graphite/50">
              {brandSlugs.length ? 'Нет коллекций для выбранного бренда' : 'Выберите бренд или откройте категорию'}
            </p>
          </div>
        )}

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
          <select
            value={wearClass}
            onChange={(e) => update('wearClass', e.target.value)}
            className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm"
          >
            <option value="">Любой</option>
            {WEAR_CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c} класс
              </option>
            ))}
          </select>
        </div>
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

        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="section-title">{pageTitle}</h1>
            <p className="mt-2 text-sm text-graphite/60 sm:text-base">
              {loading ? 'Загрузка…' : `${data?.total ?? 0} ${productWord(data?.total ?? 0)}`}
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Открыть фильтры"
              className="relative inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-graphite/15 bg-white px-3 text-sm font-semibold text-graphite transition hover:border-brand hover:text-brand sm:flex-initial"
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
              className="h-10 min-w-0 flex-1 rounded-md border border-graphite/15 bg-white px-2 text-sm sm:flex-initial sm:px-3"
            >
              <option value="newest">Сначала новые</option>
              <option value="price_asc">Цена ↑</option>
              <option value="price_desc">Цена ↓</option>
              <option value="name">По названию</option>
              <option value="popular">Популярные</option>
            </select>
          </div>
        </div>

        {inAccessorySection ? (
          <div className="mb-6 grid grid-cols-4 gap-2">
            <Link
              to="/catalog/accessories"
              className={`inline-flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 text-center text-[11px] font-semibold transition sm:gap-1.5 sm:rounded-2xl sm:px-3 sm:py-3 sm:text-sm ${
                accessoryHub
                  ? 'border-brand bg-brand text-white'
                  : 'border-graphite/12 bg-white text-graphite hover:border-brand hover:text-brand'
              }`}
            >
              <span className="opacity-80">Все</span>
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
                  className={`inline-flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 text-center text-[11px] font-semibold transition sm:gap-1.5 sm:rounded-2xl sm:px-3 sm:py-3 sm:text-sm ${
                    active
                      ? 'border-brand bg-brand text-white'
                      : 'border-graphite/12 bg-white text-graphite hover:border-brand hover:text-brand'
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} />
                  <span>{chip.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}

        <div ref={productsTopRef} className="scroll-mt-28">
          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-mist" />
              ))}
            </div>
          ) : data?.items?.length ? (
            <>
              {collectionGroups.length > 1 && collectionSlugs.length === 0 ? (
                <div className="space-y-10">
                  {collectionGroups.map(([name, items]) => (
                    <section key={name}>
                      <h2 className="mb-4 font-display text-xl font-bold text-graphite sm:text-2xl">{name}</h2>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                        {items.map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {data.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
              {data.pages > 1 ? (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={Number(page) <= 1}
                    onClick={() => update('page', String(Math.max(1, Number(page) - 1)))}
                    className="min-w-10 rounded-md bg-mist px-3 py-2 text-sm font-semibold text-graphite transition enabled:hover:bg-brand enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Назад
                  </button>
                  {pageWindow(Number(page) || 1, data.pages).map((item, idx) =>
                    item === '…' ? (
                      <span key={`e${idx}`} className="px-1 text-graphite/40">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => update('page', String(item))}
                        className={`min-w-10 rounded-md px-3 py-2 text-sm font-semibold ${
                          String(item) === page ? 'bg-brand text-white' : 'bg-mist text-graphite hover:bg-brand/15'
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={Number(page) >= data.pages}
                    onClick={() => update('page', String(Math.min(data.pages, Number(page) + 1)))}
                    className="min-w-10 rounded-md bg-mist px-3 py-2 text-sm font-semibold text-graphite transition enabled:hover:bg-brand enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Далее →
                  </button>
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

      {brandModalOpen ? (
        <OptionPickerModal
          title="Бренды"
          options={brandChips}
          selected={brandSlugs}
          onClose={() => setBrandModalOpen(false)}
          onApply={setBrandList}
          applyLabel={`Показать ${data?.total ?? 0} ${productWord(data?.total ?? 0)}`}
          searchPlaceholder="Поиск бренда"
        />
      ) : null}

      {collectionModalOpen ? (
        <OptionPickerModal
          title="Коллекции"
          options={collectionChips}
          selected={collectionSlugs}
          onClose={() => setCollectionModalOpen(false)}
          onApply={setCollectionList}
          applyLabel={`Показать ${data?.total ?? 0} ${productWord(data?.total ?? 0)}`}
          searchPlaceholder="Поиск коллекции"
        />
      ) : null}

    </>
  );
}
