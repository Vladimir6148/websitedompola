import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Download, RefreshCw, Save, Upload } from 'lucide-react';
import { api, formatPrice } from '../../lib/api';
import type { Product, ProductsResponse } from '../../types';
import {
  aggregateCollectionRows,
  packPriceFromRow,
  parseCsv,
  rowsToCsv,
  type CollectionPriceRow,
} from '../../lib/collectionPrices';
import { AdminPageHeader, adminInputClass, adminLabelClass, adminPanelClass, adminSelectClass } from './adminUi';

const CATEGORIES = [
  { slug: 'laminate', label: 'Ламинат' },
  { slug: 'quartzvinyl-spc', label: 'Кварцвинил / SPC' },
  { slug: 'mspc', label: 'MSPC' },
];

function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminCollectionPricesPage() {
  const [category, setCategory] = useState('laminate');
  const [rows, setRows] = useState<CollectionPriceRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  async function load(cat = category) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api<ProductsResponse>(
        `/api/products?published=all&limit=2000&category=${encodeURIComponent(cat)}`,
      );
      setProducts(res.items);
      setRows(aggregateCollectionRows(res.items, cat));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить товары');
      // Fallback: try static aggregation if admin API unavailable
      try {
        const res = await api<ProductsResponse>(
          `/api/products?limit=2000&category=${encodeURIComponent(cat)}`,
        );
        setProducts(res.items);
        setRows(aggregateCollectionRows(res.items, cat));
        setError('');
      } catch {
        /* keep error */
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when category changes
  }, [category]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.brand.toLowerCase().includes(q) ||
        r.collection.toLowerCase().includes(q) ||
        r.collection_slug.toLowerCase().includes(q) ||
        r.match_q.toLowerCase().includes(q),
    );
  }, [rows, filter]);

  function rowKey(r: CollectionPriceRow) {
    return r.collection_slug || `${r.brand_slug}:${r.match_q}`;
  }

  function setPrice(key: string, value: string) {
    const n = Number(String(value).replace(',', '.'));
    setRows((prev) =>
      prev.map((r) => (rowKey(r) === key ? { ...r, price_per_m2: Number.isFinite(n) ? n : 0 } : r)),
    );
  }

  async function applyRow(row: CollectionPriceRow) {
    const key = rowKey(row);
    setBusyKey(key);
    setError('');
    setMessage('');
    try {
      const body: Record<string, unknown> = {
        categorySlug: category,
        price: row.price_per_m2,
        unit: row.unit || 'м²',
        packArea: row.pack_area,
        packQty: row.pack_qty,
        length: row.length_mm,
        width: row.width_mm,
      };
      if (row.collection_slug) body.collectionSlug = row.collection_slug;
      else {
        body.q = row.match_q || row.collection;
        if (row.brand_slug) body.brandSlug = row.brand_slug;
      }

      const res = await api<{ updated: number }>('/api/products/bulk-by-collection', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setMessage(
        `«${row.collection || row.match_q}»: обновлено ${res.updated} товар(ов) в API. Для сайта — выгрузите products.json и задеплойте.`,
      );
      await load(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка применения');
    } finally {
      setBusyKey(null);
    }
  }

  async function applyAll() {
    setBusyKey('__all__');
    setError('');
    setMessage('');
    let total = 0;
    try {
      for (const row of rows) {
        if (!row.price_per_m2 && row.price_per_m2 !== 0) continue;
        const body: Record<string, unknown> = {
          categorySlug: category,
          price: row.price_per_m2,
          unit: row.unit || 'м²',
          packArea: row.pack_area,
          packQty: row.pack_qty,
          length: row.length_mm,
          width: row.width_mm,
        };
        if (row.collection_slug) body.collectionSlug = row.collection_slug;
        else {
          body.q = row.match_q || row.collection;
          if (row.brand_slug) body.brandSlug = row.brand_slug;
        }
        const res = await api<{ updated: number }>('/api/products/bulk-by-collection', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        total += res.updated;
      }
      setMessage(`Залито в API: ${total} товар(ов) по ${rows.length} коллекциям.`);
      await load(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка массовой заливки');
    } finally {
      setBusyKey(null);
    }
  }

  function exportCsv() {
    downloadText(`${category}-collection-prices.csv`, `\uFEFF${rowsToCsv(rows)}`);
  }

  function exportProductsJson() {
    // Apply current table prices onto loaded products snapshot, then download.
    const clone = structuredClone(products) as Product[];
    const now = new Date().toISOString();
    for (const row of rows) {
      for (const p of clone) {
        const match = row.collection_slug
          ? p.collection?.slug === row.collection_slug
          : row.match_q
            ? (!row.brand_slug || p.brand?.slug === row.brand_slug) &&
              p.name.toLowerCase().includes(row.match_q.toLowerCase())
            : false;
        if (!match) continue;
        p.price = row.price_per_m2;
        p.unit = row.unit || 'м²';
        if (row.pack_area != null) p.packArea = row.pack_area;
        if (row.pack_qty != null) p.packQty = row.pack_qty;
        if (row.length_mm != null) p.length = row.length_mm;
        if (row.width_mm != null) p.width = row.width_mm;
        p.updatedAt = now;
      }
    }
    downloadText(
      'products.json',
      `${JSON.stringify(clone, null, 2)}\n`,
      'application/json;charset=utf-8',
    );
    setMessage(
      'Скачан products.json с ценами из таблицы. Положите файл в apps/web/public/data/ и задеплойте — или выполните: node scripts/collection-prices.mjs apply --file …',
    );
  }

  function onImportCsv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseCsv(String(reader.result || ''));
        if (!imported.length) {
          setError('CSV пустой или не распознан');
          return;
        }
        // Merge by collection_slug / match_q
        setRows((prev) => {
          const map = new Map(prev.map((r) => [rowKey(r), r]));
          for (const inc of imported) {
            const key = rowKey(inc);
            const existing = map.get(key);
            if (existing) {
              map.set(key, {
                ...existing,
                ...inc,
                products_count: existing.products_count || inc.products_count,
              });
            } else {
              map.set(key, inc);
            }
          }
          return [...map.values()].sort((a, b) => {
            const br = a.brand.localeCompare(b.brand, 'ru');
            if (br) return br;
            return a.collection.localeCompare(b.collection, 'ru');
          });
        });
        setMessage(`Импортировано ${imported.length} строк из CSV. Нажмите «Залить все» или «Применить» по строкам.`);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка разбора CSV');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Каталог"
        title="Цены коллекций"
        description="Меняйте цену ₽/м² сразу для всех товаров коллекции. CSV — для Excel; «Выгрузить products.json» — для GitHub Pages."
      />

      <div className={`${adminPanelClass} mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end`}>
        <div className="min-w-[160px] flex-1">
          <label className={adminLabelClass}>Категория</label>
          <select
            className={adminSelectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px] flex-[2]">
          <label className={adminLabelClass}>Поиск</label>
          <input
            className={adminInputClass}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Бренд или коллекция"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary inline-flex items-center gap-1.5" onClick={() => void load()}>
            <RefreshCw size={15} />
            Обновить
          </button>
          <button type="button" className="btn-secondary inline-flex items-center gap-1.5" onClick={exportCsv}>
            <Download size={15} />
            CSV
          </button>
          <label className="btn-secondary inline-flex cursor-pointer items-center gap-1.5">
            <Upload size={15} />
            Импорт CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onImportCsv} />
          </label>
          <button type="button" className="btn-secondary inline-flex items-center gap-1.5" onClick={exportProductsJson}>
            <Download size={15} />
            products.json
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-1.5"
            disabled={busyKey === '__all__' || loading}
            onClick={() => void applyAll()}
          >
            <Save size={15} />
            Залить все в API
          </button>
        </div>
      </div>

      {message ? <p className="mb-3 text-sm text-brand-dark">{message}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div className={`${adminPanelClass} overflow-x-auto p-0`}>
        {loading ? (
          <p className="p-5 text-sm text-graphite/55">Загрузка…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-graphite/10 bg-mist/60 text-xs uppercase tracking-wide text-graphite/50">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Бренд</th>
                <th className="px-3 py-2.5 font-semibold">Коллекция</th>
                <th className="px-3 py-2.5 font-semibold">Упаковка</th>
                <th className="px-3 py-2.5 font-semibold">₽/м²</th>
                <th className="px-3 py-2.5 font-semibold">₽/упак</th>
                <th className="px-3 py-2.5 font-semibold">Товаров</th>
                <th className="px-3 py-2.5 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const key = rowKey(r);
                const pack = packPriceFromRow(r);
                const packLabel =
                  r.length_mm && r.width_mm && r.pack_qty
                    ? `${r.length_mm}×${r.width_mm} × ${r.pack_qty} шт${
                        r.pack_area ? ` · ${r.pack_area} м²` : ''
                      }`
                    : r.pack_area
                      ? `${r.pack_area} м²`
                      : '—';
                return (
                  <tr key={key} className="border-b border-graphite/8 last:border-0">
                    <td className="px-3 py-2 align-middle font-medium">{r.brand || '—'}</td>
                    <td className="px-3 py-2 align-middle">
                      <div>{r.collection || r.match_q || '—'}</div>
                      <div className="text-[11px] text-graphite/45">
                        {r.collection_slug || (r.match_q ? `q:${r.match_q}` : '')}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle text-graphite/70">{packLabel}</td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className={`${adminInputClass} max-w-[120px]`}
                        value={r.price_per_m2 || ''}
                        onChange={(e) => setPrice(key, e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle text-graphite/70">
                      {pack != null ? formatPrice(pack) : '—'}
                    </td>
                    <td className="px-3 py-2 align-middle">{r.products_count}</td>
                    <td className="px-3 py-2 align-middle text-right">
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1.5 text-xs"
                        disabled={busyKey === key || busyKey === '__all__'}
                        onClick={() => void applyRow(r)}
                      >
                        {busyKey === key ? '…' : 'Применить'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!visible.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-graphite/50">
                    Нет коллекций
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
