import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Brand, Category, Lead, Promotion, Store, City } from '../../types';

export function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', description: '', image: '', active: true });

  async function load() {
    setItems(await api<Category[]>('/api/categories?all=1'));
  }
  useEffect(() => { load().catch(() => undefined); }, []);

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
      <h1 className="font-display text-3xl font-semibold">Категории</h1>
      <form onSubmit={create} className="mt-4 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Описание" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="URL изображения" className="rounded-md border border-graphite/15 px-3 py-2" />
        <button className="btn-primary">Создать</button>
      </form>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-5">
            <input value={item.name} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2" />
            <input value={item.description || ''} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, description: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2 md:col-span-2" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.active} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, active: e.target.checked } : x))} /> Активна</label>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => save(item)}>Сохранить</button>
              <button type="button" className="text-red-600" onClick={() => remove(item.id)}>Удалить</button>
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
  useEffect(() => { load().catch(() => undefined); }, []);

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
      <h1 className="font-display text-3xl font-semibold">Бренды</h1>
      <form onSubmit={create} className="mt-4 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-5">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Сайт" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input value={form.logo || ''} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="Логотип URL" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Описание" className="rounded-md border border-graphite/15 px-3 py-2" />
        <button className="btn-primary">Создать</button>
      </form>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-5">
            <input value={item.name} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2" />
            <input value={item.website || ''} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, website: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2" />
            <input value={item.description || ''} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, description: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.active} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, active: e.target.checked } : x))} /> Активен</label>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => save(item)}>Сохранить</button>
              <button type="button" className="text-red-600" onClick={() => remove(item.id)}>Удалить</button>
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
  useEffect(() => { load().catch(() => undefined); }, []);

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
      <h1 className="font-display text-3xl font-semibold">Заявки</h1>
      <div className="mt-6 space-y-3">
        {items.map((lead) => (
          <div key={lead.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{lead.name} · {lead.phone}</div>
                <div className="text-sm text-graphite/55">{lead.city?.name || '—'} · {lead.source || 'site'} · {new Date(lead.createdAt).toLocaleString('ru-RU')}</div>
                <p className="mt-2 text-sm">{lead.comment}</p>
              </div>
              <select value={lead.status} onChange={(e) => setStatus(lead.id, e.target.value)} className="rounded-md border border-graphite/15 px-3 py-2 text-sm">
                {Object.entries(labels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminStoresPage() {
  const [items, setItems] = useState<Store[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({ name: '', address: '', phone: '', schedule: '', cityId: '' });

  async function load() {
    const [stores, cts] = await Promise.all([api<Store[]>('/api/stores?all=1'), api<City[]>('/api/content/cities')]);
    setItems(stores);
    setCities(cts);
    if (!form.cityId && cts[0]) setForm((f) => ({ ...f, cityId: cts[0].id }));
  }
  useEffect(() => { load().catch(() => undefined); }, []);

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
      <h1 className="font-display text-3xl font-semibold">Магазины</h1>
      <form onSubmit={create} className="mt-4 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-3">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Адрес" className="rounded-md border border-graphite/15 px-3 py-2" />
        <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} className="rounded-md border border-graphite/15 px-3 py-2">
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Телефон" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="График" className="rounded-md border border-graphite/15 px-3 py-2" />
        <button className="btn-primary">Добавить</button>
      </form>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-2">
            <input value={item.name} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2" />
            <input value={item.address} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, address: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2" />
            <input value={item.phone || ''} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, phone: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2" />
            <input value={item.schedule || ''} onChange={(e) => setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, schedule: e.target.value } : x))} className="rounded-md border border-graphite/15 px-3 py-2" />
            <button type="button" className="btn-secondary" onClick={() => save(item)}>Сохранить</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [form, setForm] = useState({ title: '', description: '', image: '', discountPercent: '' });

  async function load() {
    setItems(await api<Promotion[]>('/api/promotions?all=1'));
  }
  useEffect(() => { load().catch(() => undefined); }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api('/api/promotions', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        discountPercent: form.discountPercent ? Number(form.discountPercent) : null,
      }),
    });
    setForm({ title: '', description: '', image: '', discountPercent: '' });
    await load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Акции</h1>
      <form onSubmit={create} className="mt-4 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-2">
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Название" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} placeholder="% скидки" className="rounded-md border border-graphite/15 px-3 py-2" />
        <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="URL изображения" className="rounded-md border border-graphite/15 px-3 py-2 md:col-span-2" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Описание" className="rounded-md border border-graphite/15 px-3 py-2 md:col-span-2" />
        <button className="btn-primary md:col-span-2">Создать акцию</button>
      </form>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {items.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="font-semibold">{p.title}</div>
            <div className="text-sm text-graphite/60">{p.description}</div>
            {p.discountPercent ? <div className="mt-2 text-brand font-bold">−{p.discountPercent}%</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
