import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { Brand, Category, Lead, Promotion, Store, City } from '../../types';
import {
  AdminPageHeader,
  StatusBadge,
  adminInputClass,
  adminLabelClass,
  adminPanelClass,
  adminSelectClass,
  adminTextareaClass,
} from './adminUi';

export function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', description: '', image: '', active: true });

  async function load() {
    setItems(await api<Category[]>('/api/categories?all=1'));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api('/api/categories', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', description: '', image: '', active: true });
    await load();
  }

  async function save(item: Category) {
    await api(`/api/categories/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: item.name,
        description: item.description,
        image: item.image,
        active: item.active,
        sortOrder: item.sortOrder,
      }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Удалить категорию?')) return;
    await api(`/api/categories/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Каталог"
        title="Категории"
        description="Разделы напольных покрытий и аксессуаров"
      />
      <form onSubmit={create} className={`${adminPanelClass} grid gap-2 md:grid-cols-4`}>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Название"
          className={adminInputClass}
        />
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Описание"
          className={adminInputClass}
        />
        <input
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          placeholder="URL изображения"
          className={adminInputClass}
        />
        <button className="btn-primary">
          <Plus size={16} strokeWidth={1.75} />
          Создать
        </button>
      </form>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`${adminPanelClass} grid gap-2 md:grid-cols-5`}>
            <input
              value={item.name}
              onChange={(e) =>
                setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)))
              }
              className={adminInputClass}
            />
            <input
              value={item.description || ''}
              onChange={(e) =>
                setItems((arr) =>
                  arr.map((x) => (x.id === item.id ? { ...x, description: e.target.value } : x)),
                )
              }
              className={`${adminInputClass} md:col-span-2`}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) =>
                  setItems((arr) =>
                    arr.map((x) => (x.id === item.id ? { ...x, active: e.target.checked } : x)),
                  )
                }
              />
              Активна
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => save(item)}>
                <Save size={15} strokeWidth={1.75} />
                Сохранить
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"
                onClick={() => remove(item.id)}
              >
                <Trash2 size={15} strokeWidth={1.75} />
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminBrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [form, setForm] = useState({ name: '', description: '', website: '', logo: '', active: true });

  async function load() {
    setItems(await api<Brand[]>('/api/brands?all=1'));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api('/api/brands', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', description: '', website: '', logo: '', active: true });
    await load();
  }

  async function save(item: Brand) {
    await api(`/api/brands/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Удалить бренд?')) return;
    await api(`/api/brands/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Каталог" title="Бренды" description="Производители покрытий и материалов" />
      <form onSubmit={create} className={`${adminPanelClass} grid gap-2 md:grid-cols-5`}>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Название"
          className={adminInputClass}
        />
        <input
          value={form.website || ''}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="Сайт"
          className={adminInputClass}
        />
        <input
          value={form.logo || ''}
          onChange={(e) => setForm({ ...form, logo: e.target.value })}
          placeholder="Логотип URL"
          className={adminInputClass}
        />
        <input
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Описание"
          className={adminInputClass}
        />
        <button className="btn-primary">
          <Plus size={16} strokeWidth={1.75} />
          Создать
        </button>
      </form>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`${adminPanelClass} grid gap-2 md:grid-cols-5`}>
            <input
              value={item.name}
              onChange={(e) =>
                setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)))
              }
              className={adminInputClass}
            />
            <input
              value={item.website || ''}
              onChange={(e) =>
                setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, website: e.target.value } : x)))
              }
              className={adminInputClass}
            />
            <input
              value={item.description || ''}
              onChange={(e) =>
                setItems((arr) =>
                  arr.map((x) => (x.id === item.id ? { ...x, description: e.target.value } : x)),
                )
              }
              className={adminInputClass}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) =>
                  setItems((arr) =>
                    arr.map((x) => (x.id === item.id ? { ...x, active: e.target.checked } : x)),
                  )
                }
              />
              Активен
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => save(item)}>
                <Save size={15} strokeWidth={1.75} />
                Сохранить
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"
                onClick={() => remove(item.id)}
              >
                <Trash2 size={15} strokeWidth={1.75} />
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminLeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  async function load() {
    setItems(await api<Lead[]>('/api/leads'));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function setStatus(id: string, status: string) {
    await api(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
  }

  const labels: Record<string, string> = {
    NEW: 'Новая',
    IN_PROGRESS: 'В работе',
    CONTACTED: 'Связались',
    COMPLETED: 'Завершена',
    CANCELLED: 'Отменена',
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Клиенты"
        title="Заявки"
        description="Обращения с сайта, менеджера и форм"
      />
      <div className="space-y-3">
        {items.map((lead) => (
          <div key={lead.id} className={adminPanelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-graphite">
                  {lead.name} · {lead.phone}
                </div>
                <div className="text-sm text-graphite/55">
                  {lead.city?.name || '—'} · {lead.source || 'site'} ·{' '}
                  {new Date(lead.createdAt).toLocaleString('ru-RU')}
                </div>
                <p className="mt-2 text-sm text-graphite/80">{lead.comment}</p>
              </div>
              <select
                value={lead.status}
                onChange={(e) => setStatus(lead.id, e.target.value)}
                className={`${adminSelectClass} w-auto min-w-[10rem]`}
              >
                {Object.entries(labels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {!items.length ? (
          <p className="text-sm text-graphite/50">Заявок пока нет.</p>
        ) : null}
      </div>
    </div>
  );
}

export function AdminStoresPage() {
  const [items, setItems] = useState<Store[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({ name: '', address: '', phone: '', schedule: '', cityId: '' });

  async function load() {
    const [stores, cts] = await Promise.all([
      api<Store[]>('/api/stores?all=1'),
      api<City[]>('/api/content/cities'),
    ]);
    setItems(stores);
    setCities(cts);
    if (!form.cityId && cts[0]) setForm((f) => ({ ...f, cityId: cts[0].id }));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api('/api/stores', { method: 'POST', body: JSON.stringify(form) });
    await load();
  }

  async function save(item: Store) {
    await api(`/api/stores/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: item.name,
        address: item.address,
        phone: item.phone,
        schedule: item.schedule,
        description: item.description,
        active: item.active,
        cityId: item.cityId,
        lat: item.lat,
        lng: item.lng,
      }),
    });
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Контакты"
        title="Магазины"
        description="Адреса, телефоны и точки на карте"
      />
      <form onSubmit={create} className={`${adminPanelClass} grid gap-2 md:grid-cols-3`}>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Название"
          className={adminInputClass}
        />
        <input
          required
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Адрес"
          className={adminInputClass}
        />
        <select
          value={form.cityId}
          onChange={(e) => setForm({ ...form, cityId: e.target.value })}
          className={adminSelectClass}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Телефон"
          className={adminInputClass}
        />
        <input
          value={form.schedule}
          onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          placeholder="График"
          className={adminInputClass}
        />
        <button className="btn-primary">
          <Plus size={16} strokeWidth={1.75} />
          Добавить
        </button>
      </form>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`${adminPanelClass} grid gap-2 md:grid-cols-2`}>
            <input
              value={item.name}
              onChange={(e) =>
                setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)))
              }
              className={adminInputClass}
            />
            <input
              value={item.address}
              onChange={(e) =>
                setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, address: e.target.value } : x)))
              }
              className={adminInputClass}
            />
            <input
              value={item.phone || ''}
              onChange={(e) =>
                setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, phone: e.target.value } : x)))
              }
              className={adminInputClass}
            />
            <input
              value={item.schedule || ''}
              onChange={(e) =>
                setItems((arr) =>
                  arr.map((x) => (x.id === item.id ? { ...x, schedule: e.target.value } : x)),
                )
              }
              className={adminInputClass}
            />
            <button type="button" className="btn-secondary md:col-span-2 md:w-fit" onClick={() => save(item)}>
              <Save size={15} strokeWidth={1.75} />
              Сохранить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    discountPercent: '',
    sortOrder: '0',
    active: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setItems(await api<Promotion[]>('/api/promotions?all=1'));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      image: '',
      discountPercent: '',
      sortOrder: String((items.length || 0) + 1),
      active: true,
    });
    setError('');
  }

  function startEdit(p: Promotion) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description || '',
      image: p.image || '',
      discountPercent: p.discountPercent != null ? String(p.discountPercent) : '',
      sortOrder: String(p.sortOrder ?? 0),
      active: p.active,
    });
    setError('');
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    const body = new FormData();
    body.append('files', files[0]);
    const res = await api<{ items: { url: string }[] }>('/api/upload', { method: 'POST', body });
    if (res.items[0]?.url) setForm((f) => ({ ...f, image: res.items[0].url }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      description: form.description || null,
      image: form.image || null,
      discountPercent: form.discountPercent ? Number(form.discountPercent) : null,
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      if (editingId) {
        await api(`/api/promotions/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/api/promotions', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Promotion) {
    await api(`/api/promotions/${p.id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !p.active }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Удалить акцию со слайдера?')) return;
    await api(`/api/promotions/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Главная"
        title="Акции / слайдер"
        description="Активные акции с изображением показываются в карусели на главной"
      />

      <form onSubmit={save} className={`${adminPanelClass} grid gap-3 md:grid-cols-2`}>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Название акции"
          className={adminInputClass}
        />
        <input
          value={form.discountPercent}
          onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
          placeholder="% скидки"
          className={adminInputClass}
        />
        <input
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          placeholder="URL изображения слайда"
          className={`${adminInputClass} md:col-span-2`}
        />
        <div className="md:col-span-2">
          <label className={adminLabelClass}>Или загрузить фото</label>
          <input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files)} className="text-sm" />
        </div>
        {form.image ? (
          <div className="md:col-span-2">
            <img src={form.image} alt="" className="h-36 w-full rounded-xl object-cover" />
          </div>
        ) : null}
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Краткое описание на слайде"
          rows={3}
          className={`${adminTextareaClass} md:col-span-2`}
        />
        <input
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          placeholder="Порядок"
          className={adminInputClass}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Показывать в карусели
        </label>
        {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={16} strokeWidth={1.75} />
            {saving ? 'Сохраняем…' : editingId ? 'Сохранить изменения' : 'Добавить на слайдер'}
          </button>
          {editingId ? (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Отмена
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {items
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-graphite/8 bg-white">
              {p.image ? <img src={p.image} alt={p.title} className="aspect-[16/9] w-full object-cover" /> : null}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-graphite">{p.title}</div>
                    <div className="text-sm text-graphite/60">{p.description}</div>
                    <div className="mt-2">
                      <StatusBadge active={p.active} onLabel="В карусели" offLabel="Скрыта" />
                    </div>
                  </div>
                  {p.discountPercent ? (
                    <span className="rounded-md bg-brand px-2 py-1 text-xs font-bold text-white">
                      −{p.discountPercent}%
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-brand"
                    onClick={() => startEdit(p)}
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                    Изменить
                  </button>
                  <button type="button" className="font-medium text-graphite/70" onClick={() => toggleActive(p)}>
                    {p.active ? 'Скрыть' : 'Показать'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-red-600"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
