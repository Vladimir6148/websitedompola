import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Folders,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Plus,
  Shield,
  Store,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import { api } from '../../lib/api';
import type { ProductsResponse } from '../../types';
import { AdminPageHeader, adminInputClass, adminPanelClass } from './adminUi';

export function AdminLoginPage() {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('admin@dompola.ru');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-mist px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 15% 10%, rgba(31,138,61,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(196,165,116,0.18), transparent 50%)',
        }}
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md rounded-2xl border border-graphite/8 bg-white/95 p-8 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white">
            <Shield size={20} strokeWidth={1.75} />
          </span>
          <div>
            <div className="font-display text-2xl font-bold tracking-tight text-graphite">ДОМПОЛА</div>
            <p className="text-sm text-graphite/55">Панель управления</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-graphite/60">Вход для администраторов и менеджеров</p>
        <div className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={adminInputClass}
            autoComplete="username"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className={adminInputClass}
            autoComplete="current-password"
          />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn-primary mt-5 w-full">
          Войти
        </button>
      </form>
    </div>
  );
}

export function AdminGuard() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-mist text-sm text-graphite/55">Загрузка…</div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

const nav = [
  { to: '/admin', label: 'Обзор', end: true, icon: LayoutDashboard },
  { to: '/admin/products', label: 'Товары', icon: Package },
  { to: '/admin/categories', label: 'Категории', icon: Folders },
  { to: '/admin/brands', label: 'Бренды', icon: Tag },
  { to: '/admin/promotions', label: 'Акции', icon: Percent },
  { to: '/admin/stores', label: 'Магазины', icon: Store },
  { to: '/admin/leads', label: 'Заявки', icon: Inbox },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
    isActive
      ? 'border-brand/30 bg-brand/10 text-brand-dark'
      : 'border-graphite/15 bg-white text-graphite/70 hover:border-brand hover:text-brand'
  }`;
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-mist">
      <header className="sticky top-0 z-50 border-b border-graphite/8 bg-white/95 backdrop-blur">
        <div className="container-dp flex items-center gap-3 py-2.5 sm:py-3">
          <Link to="/admin" className="shrink-0 font-display text-lg font-bold tracking-tight text-graphite">
            ДОМПОЛА
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto lg:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nav.map((n) => {
              const Icon = n.icon;
              return (
                <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
                  <Icon size={15} strokeWidth={1.75} />
                  {n.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm">
            <span className="hidden text-graphite/55 xl:inline">
              {user?.name} · {user?.role}
            </span>
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-graphite/20 bg-white px-3 text-xs font-semibold text-graphite transition hover:border-brand hover:text-brand sm:h-10 sm:text-sm"
            >
              <ExternalLink size={15} strokeWidth={1.75} />
              На сайт
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-graphite/20 bg-white text-graphite transition hover:border-red-500 hover:text-red-600 sm:h-10 sm:w-10"
              aria-label="Выйти"
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="container-dp flex gap-1.5 overflow-x-auto pb-3 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
                <Icon size={14} strokeWidth={1.75} />
                {n.label}
              </NavLink>
            );
          })}
        </div>
      </header>
      <main className="container-dp py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, leads: 0, categories: 0, brands: 0 });

  useEffect(() => {
    Promise.all([
      api<ProductsResponse>('/api/products?published=all&limit=1'),
      api<unknown[]>('/api/leads'),
      api<unknown[]>('/api/categories?all=1'),
      api<unknown[]>('/api/brands?all=1'),
    ])
      .then(([products, leads, categories, brands]) => {
        setStats({
          products: products.total || 0,
          leads: Array.isArray(leads) ? leads.length : 0,
          categories: Array.isArray(categories) ? categories.length : 0,
          brands: Array.isArray(brands) ? brands.length : 0,
        });
      })
      .catch(() => undefined);
  }, []);

  const cards = [
    { label: 'Товары', value: stats.products, to: '/admin/products', icon: Package },
    { label: 'Заявки', value: stats.leads, to: '/admin/leads', icon: Inbox },
    { label: 'Категории', value: stats.categories, to: '/admin/categories', icon: Folders },
    { label: 'Бренды', value: stats.brands, to: '/admin/brands', icon: Tag },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Админ"
        title="Панель управления"
        description="Каталог, акции, магазины и заявки клиентов"
        action={{
          to: '/admin/products/new',
          label: 'Добавить номенклатуру',
          icon: <Plus size={16} strokeWidth={1.75} />,
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className={`${adminPanelClass} group transition hover:border-brand/30`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-graphite/50">{card.label}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full border border-graphite/15 text-brand transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-graphite">{card.value}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
