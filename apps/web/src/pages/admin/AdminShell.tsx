import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';

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
    <div className="grid min-h-screen place-items-center bg-mist px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="font-display text-2xl font-bold text-brand-dark">ДОМПОЛА Admin</div>
        <p className="mt-2 text-sm text-graphite/60">Вход для администраторов и менеджеров</p>
        <div className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-graphite/15 px-4 py-3"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full rounded-md border border-graphite/15 px-4 py-3"
          />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn-primary mt-5 w-full">Войти</button>
      </form>
    </div>
  );
}

export function AdminGuard() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center">Загрузка…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

const nav = [
  { to: '/admin', label: 'Обзор', end: true },
  { to: '/admin/products', label: 'Товары' },
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/brands', label: 'Бренды' },
  { to: '/admin/promotions', label: 'Акции' },
  { to: '/admin/stores', label: 'Магазины' },
  { to: '/admin/leads', label: 'Заявки' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#f5f7f4]">
      <header className="border-b border-graphite/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="font-display text-lg font-bold text-brand-dark">ДОМПОЛА</Link>
            <nav className="hidden gap-3 md:flex">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} className="text-sm font-medium text-graphite/70 hover:text-brand">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-graphite/60 sm:inline">{user?.name} · {user?.role}</span>
            <Link to="/" className="text-graphite/60 hover:text-brand">На сайт</Link>
            <button type="button" onClick={logout} className="text-red-600">Выйти</button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-full bg-mist px-3 py-1 text-xs font-medium">
              {n.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, leads: 0, categories: 0, brands: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/products?published=all&limit=1', {
        headers: { Authorization: `Bearer ${localStorage.getItem('dompola_token')}` },
      }).then((r) => r.json()),
      fetch('/api/leads', {
        headers: { Authorization: `Bearer ${localStorage.getItem('dompola_token')}` },
      }).then((r) => r.json()),
      fetch('/api/categories?all=1').then((r) => r.json()),
      fetch('/api/brands?all=1').then((r) => r.json()),
    ]).then(([products, leads, categories, brands]) => {
      setStats({
        products: products.total || 0,
        leads: Array.isArray(leads) ? leads.length : 0,
        categories: Array.isArray(categories) ? categories.length : 0,
        brands: Array.isArray(brands) ? brands.length : 0,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Панель управления</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Товары', stats.products, '/admin/products'],
          ['Заявки', stats.leads, '/admin/leads'],
          ['Категории', stats.categories, '/admin/categories'],
          ['Бренды', stats.brands, '/admin/brands'],
        ].map(([label, value, to]) => (
          <Link key={label as string} to={to as string} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-graphite/50">{label as string}</div>
            <div className="mt-2 font-display text-3xl font-semibold">{value as number}</div>
          </Link>
        ))}
      </div>
      <Link to="/admin/products/new" className="btn-primary mt-8 inline-flex">Добавить номенклатуру</Link>
    </div>
  );
}
