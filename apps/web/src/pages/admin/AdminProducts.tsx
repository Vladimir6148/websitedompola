import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import { api, formatPrice, primaryImage } from '../../lib/api';
import { suggestedPackArea } from '../../lib/packaging';
import type { Brand, Category, City, Product, ProductsResponse } from '../../types';
import {
  AdminPageHeader,
  AdminSectionTitle,
  StatusBadge,
  adminInputClass,
  adminLabelClass,
  adminPanelClass,
  adminSelectClass,
  adminTextareaClass,
} from './adminUi';

export function AdminProductsPage() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [q, setQ] = useState('');

  async function load() {
    const qs = new URLSearchParams({ published: 'all', limit: '50' });
    if (q) qs.set('q', q);
    setData(await api<ProductsResponse>(`/api/products?${qs}`));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function remove(id: string) {
    if (!confirm('Удалить товар?')) return;
    await api(`/api/products/${id}`, { method: 'DELETE' });
    await load();
  }

  async function togglePublish(p: Product) {
    await api(`/api/products/${p.id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published: !p.published }),
    });
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Каталог"
        title="Товары"
        description="Номенклатура, цены и публикация на сайте"
        action={{
          to: '/admin/products/new',
          label: 'Добавить номенклатуру',
          icon: <Plus size={16} strokeWidth={1.75} />,
        }}
      />
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск"
          className={`${adminInputClass} max-w-xs`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') load();
          }}
        />
        <button type="button" className="btn-secondary" onClick={() => load()}>
          <Search size={15} strokeWidth={1.75} />
          Найти
        </button>
      </div>
      <div className={`${adminPanelClass} mt-5 overflow-x-auto p-0`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-graphite/10 text-graphite/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Товар</th>
              <th className="px-4 py-3 font-semibold">Артикул</th>
              <th className="px-4 py-3 font-semibold">Цена</th>
              <th className="px-4 py-3 font-semibold">Статус</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((p) => (
              <tr key={p.id} className="border-b border-graphite/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={primaryImage(p)} alt="" className="h-12 w-12 rounded-md object-cover" />
                    <div>
                      <div className="font-medium text-graphite">{p.name}</div>
                      <div className="text-xs text-graphite/50">{p.category?.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-graphite/70">{p.sku}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(p.price)}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => togglePublish(p)}>
                    <StatusBadge
                      active={!!p.published}
                      onLabel="Опубликован"
                      offLabel="Скрыт"
                    />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/admin/products/${p.id}`}
                    className="mr-3 inline-flex items-center gap-1 font-semibold text-brand"
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                    Изменить
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="inline-flex items-center gap-1 font-semibold text-red-600"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type CharRow = { key: string; label: string; value: string };
type ImageRow = { url: string; alt: string; isPrimary: boolean };
type StockRow = { cityId: string; status: 'IN_STOCK' | 'ON_ORDER' | 'OUT_OF_STOCK'; quantity: number };

const emptyForm = {
  name: '',
  sku: '',
  slug: '',
  description: '',
  price: '',
  oldPrice: '',
  unit: 'м²',
  packArea: '',
  packQty: '',
  thickness: '',
  wearClass: '',
  length: '',
  width: '',
  color: '',
  bevel: '',
  lockType: '',
  wearLayer: '',
  moistureResistant: false,
  underfloorHeating: false,
  published: true,
  featured: false,
  categoryId: '',
  brandId: '',
  seoTitle: '',
  seoDescription: '',
};

export function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [chars, setChars] = useState<CharRow[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [error, setError] = useState('');
  const [defs, setDefs] = useState<{ key: string; label: string }[]>([]);
  const [newCharLabel, setNewCharLabel] = useState('');

  useEffect(() => {
    Promise.all([
      api<Category[]>('/api/categories?all=1'),
      api<Brand[]>('/api/brands?all=1'),
      api<City[]>('/api/content/cities'),
      api<{ key: string; label: string }[]>('/api/content/characteristic-definitions'),
    ]).then(([cats, br, cts, d]) => {
      setCategories(cats);
      setBrands(br);
      setCities(cts);
      setDefs(d);
      if (isNew) {
        setForm((f) => ({
          ...f,
          categoryId: cats[0]?.id || '',
          brandId: br[0]?.id || '',
        }));
        setStocks(cts.map((c) => ({ cityId: c.id, status: 'IN_STOCK' as const, quantity: 0 })));
      }
    });
  }, [isNew]);

  useEffect(() => {
    if (isNew) return;
    api<Product>(`/api/products/id/${id}`).then((p) => {
      setForm({
        name: p.name,
        sku: p.sku,
        slug: p.slug,
        description: p.description || '',
        price: String(p.price),
        oldPrice: p.oldPrice ? String(p.oldPrice) : '',
        unit: p.unit,
        packArea: p.packArea ? String(p.packArea) : '',
        packQty: p.packQty != null ? String(p.packQty) : '',
        thickness: p.thickness ? String(p.thickness) : '',
        wearClass: p.wearClass || '',
        length: p.length ? String(p.length) : '',
        width: p.width ? String(p.width) : '',
        color: p.color || '',
        bevel: p.bevel || '',
        lockType: p.lockType || '',
        wearLayer: p.wearLayer || '',
        moistureResistant: p.moistureResistant,
        underfloorHeating: p.underfloorHeating,
        published: p.published,
        featured: p.featured,
        categoryId: p.categoryId,
        brandId: p.brandId,
        seoTitle: p.seoTitle || '',
        seoDescription: p.seoDescription || '',
      });
      setChars(p.characteristics.map((c) => ({ key: c.key, label: c.label, value: c.value })));
      setImages(p.images.map((i) => ({ url: i.url, alt: i.alt || '', isPrimary: !!i.isPrimary })));
      setStocks(
        p.stocks.map((s) => ({
          cityId: s.cityId,
          status: s.status,
          quantity: s.quantity,
        })),
      );
    });
  }, [id, isNew]);

  function setField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    const body = new FormData();
    Array.from(files).forEach((f) => body.append('files', f));
    const res = await api<{ items: { url: string }[] }>('/api/upload', { method: 'POST', body });
    setImages((prev) => [
      ...prev,
      ...res.items.map((i, idx) => ({
        url: i.url,
        alt: form.name || 'Товар',
        isPrimary: prev.length === 0 && idx === 0,
      })),
    ]);
  }

  async function addCustomCharacteristic() {
    if (!newCharLabel.trim()) return;
    const key = newCharLabel
      .toLowerCase()
      .replace(/[^a-zа-я0-9]+/gi, '_')
      .replace(/^_|_$/g, '');
    await api('/api/content/characteristic-definitions', {
      method: 'POST',
      body: JSON.stringify({ key, label: newCharLabel.trim(), type: 'text' }),
    });
    setDefs((d) => [...d, { key, label: newCharLabel.trim() }]);
    setChars((c) => [...c, { key, label: newCharLabel.trim(), value: '' }]);
    setNewCharLabel('');
  }

  const payload = useMemo(() => {
    const price = Number(form.price);
    const oldPrice = form.oldPrice ? Number(form.oldPrice) : null;
    return {
      name: form.name,
      sku: form.sku,
      slug: form.slug || undefined,
      description: form.description || null,
      price,
      oldPrice,
      unit: form.unit,
      packArea: form.packArea ? Number(form.packArea) : null,
      packQty: form.packQty ? Number(form.packQty) : null,
      thickness: form.thickness ? Number(form.thickness) : null,
      wearClass: form.wearClass || null,
      length: form.length ? Number(form.length) : null,
      width: form.width ? Number(form.width) : null,
      color: form.color || null,
      bevel: form.bevel || null,
      lockType: form.lockType || null,
      wearLayer: form.wearLayer || null,
      moistureResistant: form.moistureResistant,
      underfloorHeating: form.underfloorHeating,
      published: form.published,
      featured: form.featured,
      categoryId: form.categoryId,
      brandId: form.brandId,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      images: images.map((img, i) => ({
        url: img.url,
        alt: img.alt || form.name,
        isPrimary: img.isPrimary || i === 0,
        sortOrder: i,
      })),
      characteristics: chars.filter((c) => c.value.trim()),
      stocks,
    };
  }, [form, images, chars, stocks]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (isNew) {
        const created = await api<Product>('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        navigate(`/admin/products/${created.id}`);
      } else {
        await api(`/api/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        navigate('/admin/products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Каталог"
        title={isNew ? 'Добавить номенклатуру' : 'Редактировать товар'}
        description="Параметры, фото, характеристики и остатки по городам"
      />
      <form onSubmit={onSubmit} className="space-y-5">
        <section className={`${adminPanelClass} grid gap-4 md:grid-cols-2`}>
          <div className="md:col-span-2">
            <AdminSectionTitle>Основное</AdminSectionTitle>
          </div>
          <Field label="Название" value={form.name} onChange={(v) => setField('name', v)} required />
          <Field label="Артикул" value={form.sku} onChange={(v) => setField('sku', v)} required />
          <Field
            label="Slug (URL)"
            value={form.slug}
            onChange={(v) => setField('slug', v)}
            placeholder="alpine-floor-dub-nordic"
          />
          <div>
            <label className={adminLabelClass}>Категория</label>
            <select
              value={form.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
              className={adminSelectClass}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminLabelClass}>Бренд</label>
            <select
              value={form.brandId}
              onChange={(e) => setField('brandId', e.target.value)}
              className={adminSelectClass}
              required
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <Field label="Цена за м² / ед." value={form.price} onChange={(v) => setField('price', v)} required />
          <Field label="Старая цена" value={form.oldPrice} onChange={(v) => setField('oldPrice', v)} />
          <Field label="Ед. изм." value={form.unit} onChange={(v) => setField('unit', v)} />
          <Field label="Толщина, мм" value={form.thickness} onChange={(v) => setField('thickness', v)} />
          <Field label="Класс" value={form.wearClass} onChange={(v) => setField('wearClass', v)} />
          <Field
            label="Длина доски, мм"
            value={form.length}
            onChange={(v) => setField('length', v)}
          />
          <Field
            label="Ширина доски, мм"
            value={form.width}
            onChange={(v) => setField('width', v)}
          />
          <Field
            label="Штук в упаковке"
            value={form.packQty}
            onChange={(v) => setField('packQty', v)}
          />
          <div>
            <Field
              label="Площадь упаковки, м²"
              value={form.packArea}
              onChange={(v) => setField('packArea', v)}
            />
            {(() => {
              const hint = suggestedPackArea(
                Number(form.length) || 0,
                Number(form.width) || 0,
                Number(form.packQty) || 0,
              );
              if (!hint) return null;
              return (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-brand hover:underline"
                  onClick={() => setField('packArea', String(hint))}
                >
                  Подставить расчёт: {hint} м² (длина × ширина × шт)
                </button>
              );
            })()}
          </div>
          <Field label="Цвет" value={form.color} onChange={(v) => setField('color', v)} />
          <Field label="Фаска" value={form.bevel} onChange={(v) => setField('bevel', v)} />
          <Field label="Замок" value={form.lockType} onChange={(v) => setField('lockType', v)} />
          <Field label="Защитный слой" value={form.wearLayer} onChange={(v) => setField('wearLayer', v)} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.moistureResistant}
              onChange={(e) => setField('moistureResistant', e.target.checked)}
            />{' '}
            Влагостойкость
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.underfloorHeating}
              onChange={(e) => setField('underfloorHeating', e.target.checked)}
            />{' '}
            Тёплый пол
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setField('published', e.target.checked)}
            />{' '}
            Опубликован
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setField('featured', e.target.checked)}
            />{' '}
            Популярный
          </label>
          <div className="md:col-span-2">
            <label className={adminLabelClass}>Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={4}
              className={adminTextareaClass}
            />
          </div>
          <Field label="SEO Title" value={form.seoTitle} onChange={(v) => setField('seoTitle', v)} />
          <Field
            label="SEO Description"
            value={form.seoDescription}
            onChange={(v) => setField('seoDescription', v)}
          />
        </section>

        <section className={adminPanelClass}>
          <AdminSectionTitle>Изображения</AdminSectionTitle>
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-3 text-sm"
            onChange={(e) => onUpload(e.target.files)}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((img, idx) => (
              <div key={`${img.url}-${idx}`} className="rounded-xl border border-graphite/10 p-2">
                <img src={img.url} alt={img.alt} className="aspect-square w-full rounded-lg object-cover" />
                <input
                  value={img.alt}
                  onChange={(e) =>
                    setImages((arr) => arr.map((x, i) => (i === idx ? { ...x, alt: e.target.value } : x)))
                  }
                  className="mt-2 w-full rounded border border-graphite/10 px-2 py-1 text-xs"
                  placeholder="Alt"
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="primary"
                      checked={img.isPrimary}
                      onChange={() =>
                        setImages((arr) => arr.map((x, i) => ({ ...x, isPrimary: i === idx })))
                      }
                    />
                    Главное
                  </label>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-red-600"
                    onClick={() => setImages((arr) => arr.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={12} strokeWidth={1.75} />
                    Удалить
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-graphite/60"
                    disabled={idx === 0}
                    onClick={() =>
                      setImages((arr) => {
                        const next = [...arr];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        return next;
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-graphite/60"
                    disabled={idx === images.length - 1}
                    onClick={() =>
                      setImages((arr) => {
                        const next = [...arr];
                        [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                        return next;
                      })
                    }
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={adminPanelClass}>
          <AdminSectionTitle>Характеристики</AdminSectionTitle>
          <div className="mt-3 space-y-2">
            {chars.map((c, idx) => (
              <div key={`${c.key}-${idx}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={c.label}
                  onChange={(e) =>
                    setChars((arr) =>
                      arr.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                    )
                  }
                  className={adminInputClass}
                  placeholder="Название"
                />
                <input
                  value={c.value}
                  onChange={(e) =>
                    setChars((arr) =>
                      arr.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)),
                    )
                  }
                  className={adminInputClass}
                  placeholder="Значение"
                />
                <button
                  type="button"
                  onClick={() => setChars((arr) => arr.filter((_, i) => i !== idx))}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                  Удалить
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              className={`${adminSelectClass} w-auto`}
              defaultValue=""
              onChange={(e) => {
                const def = defs.find((d) => d.key === e.target.value);
                if (!def) return;
                setChars((arr) => [...arr, { key: def.key, label: def.label, value: '' }]);
                e.target.value = '';
              }}
            >
              <option value="">Добавить из справочника</option>
              {defs.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              value={newCharLabel}
              onChange={(e) => setNewCharLabel(e.target.value)}
              placeholder="Новая характеристика"
              className={`${adminInputClass} max-w-xs`}
            />
            <button type="button" className="btn-secondary" onClick={addCustomCharacteristic}>
              <Plus size={15} strokeWidth={1.75} />
              Создать характеристику
            </button>
          </div>
        </section>

        <section className={adminPanelClass}>
          <AdminSectionTitle>Остатки по городам</AdminSectionTitle>
          <div className="mt-3 space-y-3">
            {cities.map((city) => {
              const row = stocks.find((s) => s.cityId === city.id) || {
                cityId: city.id,
                status: 'OUT_OF_STOCK' as const,
                quantity: 0,
              };
              return (
                <div key={city.id} className="grid gap-2 md:grid-cols-3">
                  <div className="font-medium text-graphite">{city.name}</div>
                  <select
                    value={row.status}
                    onChange={(e) => {
                      const status = e.target.value as StockRow['status'];
                      setStocks((arr) => {
                        const exists = arr.some((s) => s.cityId === city.id);
                        if (!exists) return [...arr, { ...row, status }];
                        return arr.map((s) => (s.cityId === city.id ? { ...s, status } : s));
                      });
                    }}
                    className={adminSelectClass}
                  >
                    <option value="IN_STOCK">В наличии</option>
                    <option value="ON_ORDER">Под заказ</option>
                    <option value="OUT_OF_STOCK">Нет в наличии</option>
                  </select>
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => {
                      const quantity = Number(e.target.value) || 0;
                      setStocks((arr) => {
                        const exists = arr.some((s) => s.cityId === city.id);
                        if (!exists) return [...arr, { ...row, quantity }];
                        return arr.map((s) => (s.cityId === city.id ? { ...s, quantity } : s));
                      });
                    }}
                    className={adminInputClass}
                    placeholder="Количество"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            <Save size={16} strokeWidth={1.75} />
            Сохранить
          </button>
          <Link to="/admin/products" className="btn-secondary">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={adminLabelClass}>{label}</label>
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={adminInputClass}
      />
    </div>
  );
}
