import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import type { Brand, Category, ProductsResponse } from '../types';

export function CatalogPage() {
  const { categorySlug } = useParams();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') || '';
  const brand = params.get('brand') || '';
  const sort = params.get('sort') || 'newest';
  const page = params.get('page') || '1';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const wearClass = params.get('wearClass') || '';
  const moistureResistant = params.get('moistureResistant') || '';
  const underfloorHeating = params.get('underfloorHeating') || '';

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug],
  );

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
    if (categorySlug) qs.set('category', categorySlug);
    if (q) qs.set('q', q);
    if (brand) qs.set('brand', brand);
    if (sort) qs.set('sort', sort);
    if (page) qs.set('page', page);
    if (minPrice) qs.set('minPrice', minPrice);
    if (maxPrice) qs.set('maxPrice', maxPrice);
    if (wearClass) qs.set('wearClass', wearClass);
    if (moistureResistant) qs.set('moistureResistant', moistureResistant);
    if (underfloorHeating) qs.set('underfloorHeating', underfloorHeating);
    qs.set('limit', '12');

    api<ProductsResponse>(`/api/products?${qs}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [categorySlug, q, brand, sort, page, minPrice, maxPrice, wearClass, moistureResistant, underfloorHeating]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  return (
    <>
      <Seo
        title={activeCategory ? activeCategory.name : 'Каталог'}
        description={activeCategory?.description || 'Каталог напольных покрытий ДОМПОЛА'}
        path={categorySlug ? `/catalog/${categorySlug}` : '/catalog'}
      />

      <div className="container-dp py-8 md:py-12">
        <nav className="mb-4 text-sm text-graphite/50">
          <Link to="/" className="hover:text-brand">Главная</Link>
          <span className="mx-2">/</span>
          <Link to="/catalog" className="hover:text-brand">Каталог</Link>
          {activeCategory ? (
            <>
              <span className="mx-2">/</span>
              <span>{activeCategory.name}</span>
            </>
          ) : null}
        </nav>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="section-title">{activeCategory?.name || 'Каталог'}</h1>
            <p className="mt-2 text-graphite/60">
              {loading ? 'Загрузка…' : `${data?.total ?? 0} товаров`}
            </p>
          </div>
          <select
            value={sort}
            onChange={(e) => update('sort', e.target.value)}
            className="rounded-md border border-graphite/15 bg-white px-3 py-2 text-sm"
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
            <option value="name">По названию</option>
            <option value="popular">Популярные</option>
          </select>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <Link
            to="/catalog"
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${!categorySlug ? 'bg-brand text-white' : 'bg-mist text-graphite'}`}
          >
            Все
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/catalog/${c.slug}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${categorySlug === c.slug ? 'bg-brand text-white' : 'bg-mist text-graphite'}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit space-y-4 rounded-2xl border border-graphite/8 bg-white p-4 lg:sticky lg:top-28">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">Поиск</label>
              <input
                defaultValue={q}
                onChange={(e) => update('q', e.target.value)}
                placeholder="Название или артикул"
                className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">Бренд</label>
              <select
                value={brand}
                onChange={(e) => update('brand', e.target.value)}
                className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm"
              >
                <option value="">Любой</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">Цена от</label>
                <input value={minPrice} onChange={(e) => update('minPrice', e.target.value)} className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">до</label>
                <input value={maxPrice} onChange={(e) => update('maxPrice', e.target.value)} className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">Класс</label>
              <input value={wearClass} onChange={(e) => update('wearClass', e.target.value)} placeholder="32 / 33 / 43" className="w-full rounded-md border border-graphite/15 px-3 py-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={moistureResistant === '1'} onChange={(e) => update('moistureResistant', e.target.checked ? '1' : '')} />
              Влагостойкость
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={underfloorHeating === '1'} onChange={(e) => update('underfloorHeating', e.target.checked ? '1' : '')} />
              Тёплый пол
            </label>
          </aside>

          <div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-mist" />
                ))}
              </div>
            ) : data?.items?.length ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      </div>
    </>
  );
}
