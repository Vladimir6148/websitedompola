import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, RefreshCw, Save } from 'lucide-react';
import {
  api,
  clearStaticDataCache,
  fetchPriceMap,
  formatPrice,
  patchPriceMapCache,
} from '../../lib/api';
import {
  CATEGORY_BRAND_GUIDES,
  findGuideCollection,
  type GuideBrand,
  type GuideCollection,
} from '../../data/catalogBrandGuides';
import { formatPackArea, isPackPriced, pricePerM2, resolvePackArea } from '../../lib/packaging';
import type { City, Product, ProductsResponse } from '../../types';
import { AdminPageHeader, adminInputClass, adminLabelClass, adminPanelClass } from './adminUi';

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return out;
}

const CATEGORIES = [
  { slug: 'laminate', label: 'Ламинат' },
  { slug: 'quartzvinyl-spc', label: 'Кварцвинил / SPC' },
  { slug: 'mspc', label: 'MSPC' },
  { slug: 'porcelain', label: 'Керамогранит' },
  { slug: 'linoleum', label: 'Линолеум' },
  { slug: 'parquet', label: 'Паркет' },
];

const CITY_ORDER = ['arkhangelsk', 'severodvinsk', 'vologda'];

type DraftMap = Record<string, string>;

function parseNum(raw: string): number | null {
  const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function productMatchesGuide(p: Product, col: GuideCollection): boolean {
  const brands = asList(col.brand);
  if (brands.length && !brands.includes(p.brand?.slug || '')) return false;
  const cols = asList(col.collection);
  if (cols.length) {
    const slug = p.collection?.slug || '';
    if (!cols.includes(slug)) return false;
  }
  const name = (p.name || '').toLowerCase();
  const collName = (p.collection?.name || '').toLowerCase();
  if (col.q) {
    const q = col.q.toLowerCase();
    if (!name.includes(q) && !collName.includes(q)) return false;
  }
  if (col.qExclude) {
    const ex = col.qExclude.toLowerCase();
    if (name.includes(ex) || collName.includes(ex)) return false;
  }
  return true;
}

function fallbackFamilyKey(p: Product): { key: string; name: string } | null {
  const raw = (p.collection?.name || '').trim();
  if (!raw) return null;
  let name = raw
    .replace(/\s+SPC\d+\b.*$/i, '')
    .replace(/\s+\d{1,2}-\d{2,4}\b.*$/i, '')
    .replace(/\s*\(RUS\).*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const brandName = (p.brand?.name || '').trim();
  if (brandName && name.toLowerCase().startsWith(brandName.toLowerCase())) {
    name = name.slice(brandName.length).trim();
  }
  if (!name || name.length < 2) name = raw;
  return { key: `${p.brand?.slug || 'x'}::${name.toLowerCase()}`, name };
}

const chipBase =
  'rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-40';
const chipOn = 'border-brand bg-brand text-white';
const chipOff = 'border-brand/35 bg-white text-brand-dark hover:border-brand hover:bg-brand/5';

export function AdminCollectionPricesPage() {
  const [category, setCategory] = useState('quartzvinyl-spc');
  const [guideBrandSlug, setGuideBrandSlug] = useState('');
  const [guideCollectionId, setGuideCollectionId] = useState('');
  const [cityId, setCityId] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perSku, setPerSku] = useState(false);
  const [bulkPackArea, setBulkPackArea] = useState('');
  const [bulkPriceM2, setBulkPriceM2] = useState('');
  const [bulkPricePack, setBulkPricePack] = useState('');
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load(cat = category) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const [res, cityList] = await Promise.all([
        api<ProductsResponse>(
          `/api/products?limit=5000&category=${encodeURIComponent(cat)}&sort=name&livePrices=0`,
        ),
        api<City[]>('/api/content/cities').catch(() => [] as City[]),
      ]);
      setProducts(res.items);
      const ordered = [...cityList].sort((a, b) => {
        const ai = CITY_ORDER.indexOf(a.slug);
        const bi = CITY_ORDER.indexOf(b.slug);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      setCities(ordered);
      if (!cityId && ordered[0]) setCityId(ordered[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setGuideBrandSlug('');
    setGuideCollectionId('');
    setPerSku(false);
    void load(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const guideBrands: GuideBrand[] = CATEGORY_BRAND_GUIDES[category] || [];
  const activeGuideBrand = useMemo(
    () => guideBrands.find((b) => b.slug === guideBrandSlug) || null,
    [guideBrands, guideBrandSlug],
  );
  const activeGuideCol: GuideCollection | null = useMemo(() => {
    if (!guideCollectionId) return null;
    return findGuideCollection(category, guideCollectionId, guideBrandSlug || undefined)?.col || null;
  }, [category, guideCollectionId, guideBrandSlug]);

  const selectedCity = cities.find((c) => c.id === cityId) || null;

  const dataBrands = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.brand?.slug && p.brand?.name) map.set(p.brand.slug, p.brand.name);
    }
    return [...map.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [products]);

  const brandChips = guideBrands.length
    ? guideBrands.map((b) => ({ slug: b.slug, name: b.name }))
    : dataBrands;

  const collectionChips = useMemo(() => {
    if (activeGuideBrand) {
      return activeGuideBrand.collections.map((c) => ({
        id: c.id,
        name: c.name,
        count: products.filter((p) => productMatchesGuide(p, c)).length,
      }));
    }
    if (!guideBrandSlug) return [] as { id: string; name: string; count: number }[];
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const p of products) {
      if (p.brand?.slug !== guideBrandSlug) continue;
      const fam = fallbackFamilyKey(p);
      if (!fam) continue;
      const cur = map.get(fam.key) || { id: fam.key, name: fam.name, count: 0 };
      cur.count += 1;
      map.set(fam.key, cur);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [activeGuideBrand, guideBrandSlug, products]);

  const collectionProducts = useMemo(() => {
    if (!guideCollectionId) return [] as Product[];
    if (activeGuideCol) {
      return products
        .filter((p) => productMatchesGuide(p, activeGuideCol))
        .sort((a, b) => (a.sku || a.name).localeCompare(b.sku || b.name, 'ru'));
    }
    return products
      .filter((p) => {
        if (guideBrandSlug && p.brand?.slug !== guideBrandSlug) return false;
        return fallbackFamilyKey(p)?.key === guideCollectionId;
      })
      .sort((a, b) => (a.sku || a.name).localeCompare(b.sku || b.name, 'ru'));
  }, [products, guideCollectionId, activeGuideCol, guideBrandSlug]);

  // Overlay live city prices when city / collection changes
  useEffect(() => {
    if (!cityId || !collectionProducts.length) return;
    let cancelled = false;
    fetchPriceMap(cityId).then((map) => {
      if (cancelled || !Object.keys(map).length) return;
      setProducts((prev) =>
        prev.map((p) => (map[p.id] != null ? { ...p, price: map[p.id]! } : p)),
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh prices for city
  }, [cityId, guideCollectionId]);

  const selectedCollectionName =
    collectionChips.find((c) => c.id === guideCollectionId)?.name ||
    activeGuideCol?.name ||
    'Коллекция';

  const sample = collectionProducts[0];
  const sampleArea = sample ? resolvePackArea(sample) : null;
  const packSold = sample ? isPackPriced(sample) || sampleArea != null : false;

  useEffect(() => {
    if (!collectionProducts.length) {
      setBulkPackArea('');
      setBulkPriceM2('');
      setBulkPricePack('');
      setDrafts({});
      setSelected({});
      return;
    }
    const areas = collectionProducts
      .map((p) => resolvePackArea(p))
      .filter((n): n is number => n != null && n > 0);
    const sameArea = areas.length && areas.every((n) => n === areas[0]);
    setBulkPackArea(sameArea ? String(areas[0]) : sampleArea != null ? String(sampleArea) : '');

    const prices = collectionProducts.map((p) => p.price).filter((n) => n > 0);
    const samePrice = prices.length && prices.every((n) => n === prices[0]);
    const pack = samePrice ? prices[0]! : prices[0] || 0;
    const area = sameArea ? areas[0]! : sampleArea;
    if (sample && isPackPriced(sample)) {
      setBulkPricePack(pack > 0 ? String(Math.round(pack * 100) / 100) : '');
      setBulkPriceM2(
        pack > 0 && area
          ? String(Math.round((pack / area) * 100) / 100)
          : '',
      );
    } else {
      const m2 = samePrice ? pack : 0;
      setBulkPriceM2(m2 > 0 ? String(Math.round(m2 * 100) / 100) : '');
      setBulkPricePack(
        m2 > 0 && area ? String(Math.round(m2 * area * 100) / 100) : '',
      );
    }

    const nextDrafts: DraftMap = {};
    const nextSel: Record<string, boolean> = {};
    for (const p of collectionProducts) {
      nextDrafts[p.id] = p.price > 0 ? String(p.price) : '';
      nextSel[p.id] = true;
    }
    setDrafts(nextDrafts);
    setSelected(nextSel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideCollectionId, cityId, collectionProducts.length, collectionProducts[0]?.price]);

  function syncFromM2(m2Raw: string, areaRaw = bulkPackArea) {
    setBulkPriceM2(m2Raw);
    const m2 = parseNum(m2Raw);
    const area = parseNum(areaRaw);
    if (m2 != null && area != null && area > 0) {
      setBulkPricePack(String(Math.round(m2 * area * 100) / 100));
    }
  }

  function syncFromPack(packRaw: string, areaRaw = bulkPackArea) {
    setBulkPricePack(packRaw);
    const pack = parseNum(packRaw);
    const area = parseNum(areaRaw);
    if (pack != null && area != null && area > 0) {
      setBulkPriceM2(String(Math.round((pack / area) * 100) / 100));
    }
  }

  function syncFromArea(areaRaw: string) {
    setBulkPackArea(areaRaw);
    const area = parseNum(areaRaw);
    const m2 = parseNum(bulkPriceM2);
    const pack = parseNum(bulkPricePack);
    if (area == null || area <= 0) return;
    if (m2 != null) {
      setBulkPricePack(String(Math.round(m2 * area * 100) / 100));
    } else if (pack != null) {
      setBulkPriceM2(String(Math.round((pack / area) * 100) / 100));
    }
  }

  /** Catalog unit price we store (pack if unit is pack, else м²). */
  function catalogPriceToSave(): number | null {
    if (!sample) return parseNum(bulkPriceM2);
    if (isPackPriced(sample) || packSold) return parseNum(bulkPricePack);
    return parseNum(bulkPriceM2);
  }

  const selectedCount = useMemo(
    () => collectionProducts.filter((p) => selected[p.id]).length,
    [collectionProducts, selected],
  );
  const allSelected =
    collectionProducts.length > 0 && collectionProducts.every((p) => selected[p.id]);

  function toggleAll(on: boolean) {
    const next: Record<string, boolean> = {};
    for (const p of collectionProducts) next[p.id] = on;
    setSelected(next);
  }

  async function applyCollectionPrice() {
    if (!cityId) {
      setError('Выберите город');
      return;
    }
    const price = catalogPriceToSave();
    if (price == null) {
      setError('Укажите цену за м² или за упаковку');
      return;
    }
    if (!collectionProducts.length) {
      setError('В коллекции нет товаров');
      return;
    }
    const packArea = parseNum(bulkPackArea);
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await api<{ updated: number }>('/api/products/bulk-prices', {
        method: 'POST',
        body: JSON.stringify({
          productIds: collectionProducts.map((p) => p.id),
          price,
          cityId,
          packArea: packArea != null && packArea > 0 ? packArea : undefined,
          unit: sample?.unit,
        }),
      });
      const ids = collectionProducts.map((p) => p.id);
      const pricePatch = Object.fromEntries(ids.map((id) => [id, price]));
      setProducts((prev) =>
        prev.map((p) =>
          pricePatch[p.id] != null
            ? {
                ...p,
                price,
                ...(packArea != null && packArea > 0 ? { packArea } : {}),
              }
            : p,
        ),
      );
      patchPriceMapCache(pricePatch, cityId);
      clearStaticDataCache({ keepPrices: true });
      try {
        localStorage.setItem('dompola_prices_rev', String(Date.now()));
        new BroadcastChannel('dompola-prices').postMessage({ t: Date.now() });
      } catch {
        /* ignore */
      }
      setMessage(
        `Цена ${formatPrice(price)} для «${selectedCity?.name || 'города'}» сохранена — на сайте обновится сразу (выберите этот город).`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  async function applySelectedSkuPrices() {
    if (!cityId) {
      setError('Выберите город');
      return;
    }
    const targets = collectionProducts.filter((p) => selected[p.id]);
    if (!targets.length) {
      setError('Отметьте хотя бы одну позицию');
      return;
    }
    const packArea = parseNum(bulkPackArea);
    const parsed: { id: string; price: number }[] = [];
    for (const p of targets) {
      const price = parseNum(drafts[p.id] ?? '');
      if (price == null) {
        setError(`Некорректная цена у ${p.sku || p.name}`);
        return;
      }
      parsed.push({ id: p.id, price });
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await mapPool(parsed, 8, async (row) => {
        await api(`/api/products/${row.id}/price`, {
          method: 'PATCH',
          body: JSON.stringify({
            price: row.price,
            cityId,
            ...(packArea != null && packArea > 0 ? { packArea } : {}),
          }),
        });
      });
      const map = Object.fromEntries(parsed.map((r) => [r.id, r.price]));
      setProducts((prev) =>
        prev.map((p) =>
          map[p.id] != null
            ? {
                ...p,
                price: map[p.id]!,
                ...(packArea != null && packArea > 0 ? { packArea } : {}),
              }
            : p,
        ),
      );
      patchPriceMapCache(map, cityId);
      clearStaticDataCache({ keepPrices: true });
      try {
        localStorage.setItem('dompola_prices_rev', String(Date.now()));
        new BroadcastChannel('dompola-prices').postMessage({ t: Date.now() });
      } catch {
        /* ignore */
      }
      setMessage(
        `Обновлено ${parsed.length} артикулов для «${selectedCity?.name}» — на сайте цены уже новые.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  function fillDraftsFromBulk() {
    const price = catalogPriceToSave();
    if (price == null) {
      setError('Сначала укажите цену сверху');
      return;
    }
    setError('');
    const next = { ...drafts };
    for (const p of collectionProducts) {
      if (selected[p.id]) next[p.id] = String(price);
    }
    setDrafts(next);
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Каталог"
        title="Редактор цен"
        description="Сначала город, затем покрытие → бренд → коллекция. Цены на сайте обновляются сразу после сохранения."
      />

      {/* Cities — separate bar, underlined active tab */}
      <div className="mb-4 rounded-2xl border border-graphite/10 bg-white px-4 py-4 sm:px-5">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/45">
          Город
        </div>
        <p className="mt-1 text-sm text-graphite/55">
          Цены задаются отдельно для каждого города и сразу видны на сайте при выборе этого города.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-b border-graphite/10">
          {cities.map((c) => {
            const on = cityId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCityId(c.id)}
                className={`-mb-px border-b-2 px-0.5 pb-2.5 text-base font-semibold transition ${
                  on
                    ? 'border-brand text-brand-dark'
                    : 'border-transparent text-graphite/55 hover:text-graphite'
                }`}
              >
                {c.name}
              </button>
            );
          })}
          {!cities.length && !loading ? (
            <span className="pb-2.5 text-sm text-graphite/45">Города не загрузились</span>
          ) : null}
        </div>
        {selectedCity ? (
          <p className="mt-3 text-sm text-graphite/60">
            Редактируете цены для:{' '}
            <span className="font-semibold text-graphite underline decoration-brand/50 decoration-2 underline-offset-4">
              {selectedCity.name}
            </span>
          </p>
        ) : null}
      </div>

      <div className={`${adminPanelClass} mb-4 space-y-4`}>
        <div>
          <div className={adminLabelClass}>Тип покрытия</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                className={`${chipBase} ${category === c.slug ? chipOn : chipOff}`}
                onClick={() => setCategory(c.slug)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className={adminLabelClass}>Бренд</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {brandChips.map((b) => (
              <button
                key={b.slug}
                type="button"
                disabled={loading || !cityId}
                className={`${chipBase} ${guideBrandSlug === b.slug ? chipOn : chipOff}`}
                onClick={() => {
                  setGuideBrandSlug(b.slug);
                  setGuideCollectionId('');
                  setPerSku(false);
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {guideBrandSlug ? (
          <div>
            <div className={adminLabelClass}>
              Коллекции{' '}
              {activeGuideBrand?.name || brandChips.find((b) => b.slug === guideBrandSlug)?.name || ''}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {collectionChips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={loading || c.count === 0}
                  className={`${chipBase} ${guideCollectionId === c.id ? chipOn : chipOff}`}
                  onClick={() => {
                    setGuideCollectionId(c.id);
                    setPerSku(false);
                  }}
                >
                  {c.name}
                  {c.count ? (
                    <span
                      className={`ml-1.5 text-xs ${
                        guideCollectionId === c.id ? 'text-white/80' : 'text-graphite/45'
                      }`}
                    >
                      {c.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-graphite/55">
            {cityId ? 'Выберите бренд — появятся коллекции.' : 'Сначала выберите город.'}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-graphite/8 pt-3">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-1.5"
            onClick={() => void load()}
            disabled={loading || saving}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : undefined} />
            Обновить
          </button>
          {!loading ? (
            <span className="text-sm text-graphite/50">
              {selectedCity ? `${selectedCity.name} · ` : ''}
              {products.length} товаров
              {guideCollectionId ? ` · в коллекции: ${collectionProducts.length}` : ''}
            </span>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="mb-3 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5 text-sm text-brand-dark">
          <Check size={16} className="mt-0.5 shrink-0" />
          {message}
        </p>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <div className={`${adminPanelClass} flex items-center gap-2 text-sm text-graphite/55`}>
          <Loader2 size={16} className="animate-spin" />
          Загрузка каталога…
        </div>
      ) : !cityId || !guideBrandSlug ? null : !guideCollectionId ? (
        <div className={adminPanelClass}>
          <p className="text-sm text-graphite/60">Выберите коллекцию — откроется редактор цен.</p>
        </div>
      ) : (
        <div className={`${adminPanelClass} space-y-5`}>
          <div className="flex flex-col gap-1 border-b border-graphite/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-graphite">{selectedCollectionName}</h2>
              <p className="mt-1 text-sm text-graphite/55">
                {selectedCity?.name || '—'} · {sample?.brand?.name || activeGuideBrand?.name || '—'} ·{' '}
                {collectionProducts.length} позиций · {sample?.unit || 'м²'}
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-brand-dark hover:underline"
              onClick={() => setGuideCollectionId('')}
            >
              ← К коллекциям
            </button>
          </div>

          {!collectionProducts.length ? (
            <p className="text-sm text-graphite/55">В этой коллекции товаров не найдено.</p>
          ) : (
            <>
              <div className="rounded-xl border border-graphite/10 bg-mist/30 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-graphite/50">
                  Цена коллекции · {selectedCity?.name}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={adminLabelClass}>Цена за м², ₽</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      inputMode="decimal"
                      className={adminInputClass}
                      value={bulkPriceM2}
                      onChange={(e) => syncFromM2(e.target.value)}
                      placeholder="Например 1920"
                      disabled={perSku || saving}
                    />
                  </div>
                  <div>
                    <label className={adminLabelClass}>Квадратура упаковки, м²</label>
                    <input
                      type="number"
                      min={0}
                      step={0.001}
                      inputMode="decimal"
                      className={adminInputClass}
                      value={bulkPackArea}
                      onChange={(e) => syncFromArea(e.target.value)}
                      placeholder="Например 3.069"
                      disabled={perSku || saving}
                    />
                    {sampleArea != null ? (
                      <p className="mt-1 text-xs text-graphite/45">
                        Сейчас: {formatPackArea(sampleArea)} м²
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className={adminLabelClass}>Цена за упаковку, ₽</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      inputMode="decimal"
                      className={adminInputClass}
                      value={bulkPricePack}
                      onChange={(e) => syncFromPack(e.target.value)}
                      placeholder="Например 5891"
                      disabled={perSku || saving}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center justify-center gap-1.5"
                    disabled={saving || perSku || (!bulkPriceM2 && !bulkPricePack) || !cityId}
                    onClick={() => void applyCollectionPrice()}
                  >
                    {saving && !perSku ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Применить ко всей коллекции
                  </button>
                </div>
                <p className="mt-2 text-xs text-graphite/50">
                  м² и упаковка пересчитываются друг из друга. Сохраняется цена в единице товара
                  ({sample?.unit || 'м²'}) для выбранного города.
                </p>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-graphite/10 px-4 py-3">
                <div>
                  <div className="font-medium text-graphite">Редактировать каждый артикул</div>
                  <div className="text-sm text-graphite/55">
                    Цены только для «{selectedCity?.name}»
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={perSku}
                  onClick={() => setPerSku((v) => !v)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    perSku ? 'bg-brand' : 'bg-graphite/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                      perSku ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </label>

              {perSku ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1.5 text-xs"
                      onClick={() => toggleAll(!allSelected)}
                    >
                      {allSelected ? 'Снять все' : 'Выбрать все'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1.5 text-xs"
                      onClick={fillDraftsFromBulk}
                      disabled={!bulkPriceM2 && !bulkPricePack}
                    >
                      Подставить цену из блока выше
                    </button>
                    <span className="text-sm text-graphite/50">Выбрано: {selectedCount}</span>
                    <button
                      type="button"
                      className="btn-primary ml-auto inline-flex items-center gap-1.5"
                      disabled={saving || !selectedCount}
                      onClick={() => void applySelectedSkuPrices()}
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Сохранить выбранные
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-graphite/8">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-graphite/10 bg-mist/60 text-xs uppercase tracking-wide text-graphite/50">
                        <tr>
                          <th className="w-10 px-3 py-2.5" />
                          <th className="px-3 py-2.5 font-semibold">Артикул</th>
                          <th className="px-3 py-2.5 font-semibold">Название</th>
                          <th className="px-3 py-2.5 font-semibold">м²/уп</th>
                          <th className="px-3 py-2.5 font-semibold">₽/м²</th>
                          <th className="px-3 py-2.5 font-semibold">Цена ({sample?.unit || 'ед.'})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collectionProducts.map((p) => {
                          const area = resolvePackArea(p);
                          const m2 = pricePerM2({ ...p, price: parseNum(drafts[p.id] ?? '') || p.price });
                          return (
                            <tr key={p.id} className="border-b border-graphite/8 last:border-0">
                              <td className="px-3 py-2 align-middle">
                                <input
                                  type="checkbox"
                                  checked={!!selected[p.id]}
                                  onChange={(e) =>
                                    setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))
                                  }
                                  className="h-4 w-4 accent-[var(--color-brand,#008d36)]"
                                />
                              </td>
                              <td className="px-3 py-2 align-middle font-mono text-xs text-graphite/70">
                                {p.sku || '—'}
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <div className="max-w-[280px] truncate font-medium">{p.name}</div>
                              </td>
                              <td className="px-3 py-2 align-middle text-graphite/60">
                                {area != null ? formatPackArea(area) : '—'}
                              </td>
                              <td className="px-3 py-2 align-middle text-graphite/60">
                                {m2 != null ? formatPrice(m2) : '—'}
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className={`${adminInputClass} max-w-[130px]`}
                                  value={drafts[p.id] ?? ''}
                                  onChange={(e) =>
                                    setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                                  }
                                  disabled={!selected[p.id] || saving}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-graphite/8 bg-mist/20 px-3 py-2">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite/45">
                    Позиции · {selectedCity?.name} ({collectionProducts.length})
                  </div>
                  <ul className="max-h-56 space-y-1 overflow-y-auto text-sm text-graphite/70">
                    {collectionProducts.map((p) => {
                      const area = resolvePackArea(p);
                      const m2 = pricePerM2(p);
                      return (
                        <li
                          key={p.id}
                          className="flex justify-between gap-3 border-b border-graphite/5 py-1 last:border-0"
                        >
                          <span className="truncate">
                            <span className="font-mono text-xs text-graphite/50">{p.sku || '—'}</span>
                            <span className="mx-1.5 text-graphite/30">·</span>
                            {p.name}
                          </span>
                          <span className="shrink-0 text-right">
                            {formatPrice(p.price)}
                            {m2 != null ? (
                              <span className="ml-2 text-xs text-graphite/45">
                                ({formatPrice(m2)}/м²
                                {area != null ? ` · ${formatPackArea(area)} м²` : ''})
                              </span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
