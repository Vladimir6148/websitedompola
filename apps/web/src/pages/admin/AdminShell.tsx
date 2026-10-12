import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Percent,
  Shield,
  Table2,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import { api, wakeApi } from '../../lib/api';
import { BrandMark } from '../../components/BrandMark';
import { AdminOpsDashboard } from './AdminOpsDashboard';
import { adminInputClass } from './adminUi';

const REMEMBER_KEY = 'dompola_admin_remember';
const LOGIN_KEY = 'dompola_admin_login';
const PASS_KEY = 'dompola_admin_pass';

function readSavedLogin() {
  try {
    const remember = localStorage.getItem(REMEMBER_KEY) !== '0';
    return {
      remember,
      email: remember ? localStorage.getItem(LOGIN_KEY) || '' : '',
      password: remember ? localStorage.getItem(PASS_KEY) || '' : '',
    };
  } catch {
    return { remember: true, email: '', password: '' };
  }
}

export function AdminLoginPage() {
  const { login, user, loading } = useAuth();
  const saved = readSavedLogin();
  const [email, setEmail] = useState(saved.email);
  const [password, setPassword] = useState(saved.password);
  const [remember, setRemember] = useState(saved.remember);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Подключаем сервер…');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('Подключаем сервер…');
      const ok = await wakeApi(8_000);
      if (cancelled) return;
      setStatus(ok ? 'Сервер готов' : 'Можно войти — сервер подхватит запрос');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && user) return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    setStatus('Входим…');
    try {
      await login(email, password);
      try {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, '1');
          localStorage.setItem(LOGIN_KEY, email);
          localStorage.setItem(PASS_KEY, password);
        } else {
          localStorage.setItem(REMEMBER_KEY, '0');
          localStorage.removeItem(LOGIN_KEY);
          localStorage.removeItem(PASS_KEY);
        }
      } catch {
        /* ignore quota / private mode */
      }
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
      setStatus('Можно нажать «Войти» ещё раз');
    } finally {
      setBusy(false);
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
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white">
            <Shield size={20} strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <BrandMark to="/admin" size="md" />
            <span className="whitespace-nowrap text-sm leading-none text-graphite/50">
              Панель управления
            </span>
          </div>
        </div>
        <p className="mt-5 text-sm text-graphite/60">Вход для администраторов и менеджеров</p>
        <p className="mt-2 text-xs text-graphite/45">{status}</p>
        <div className="mt-5 space-y-3">
          <input
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Логин или email"
            className={adminInputClass}
            autoComplete="username"
            disabled={busy}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className={adminInputClass}
            autoComplete="current-password"
            disabled={busy}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-graphite/70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={busy}
              className="h-4 w-4 rounded border-graphite/25 text-brand focus:ring-brand"
            />
            Запомнить логин и пароль на этом устройстве
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
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
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: typeof LayoutDashboard;
  /** If set, only these roles see the item. Empty/undefined = all staff. */
  roles?: Array<'ADMIN' | 'MANAGER'>;
};

const nav: NavItem[] = [
  { to: '/admin', label: 'Обзор', end: true, icon: LayoutDashboard },
  { to: '/admin/collection-prices', label: 'Цены', icon: Table2, roles: ['ADMIN'] },
  { to: '/admin/prospects', label: 'Наработки', icon: ClipboardList },
  { to: '/admin/promotions', label: 'Акции', icon: Percent, roles: ['ADMIN'] },
  { to: '/admin/leads', label: 'Заявки', icon: Inbox },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
    isActive
      ? 'border-brand/30 bg-brand/10 text-brand-dark'
      : 'border-graphite/15 bg-white text-graphite/70 hover:border-brand hover:text-brand'
  }`;
}

function roleLabel(role?: string) {
  if (role === 'ADMIN') return 'Админ';
  if (role === 'MANAGER') return 'Менеджер';
  return role || '';
}

/** Redirect managers away from admin-only sections. */
export function RequireAdmin() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-sm text-graphite/55">Загрузка…</div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const visibleNav = nav.filter((n) => {
    if (!n.roles?.length) return true;
    return user?.role ? n.roles.includes(user.role) : false;
  });

  return (
    <div className="min-h-screen bg-mist">
      <header className="sticky top-0 z-50 border-b border-graphite/8 bg-white/95 backdrop-blur">
        <div className="container-dp flex items-center gap-3 py-2.5 sm:py-3">
          <BrandMark to="/admin" size="md" />
          <nav className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto lg:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleNav.map((n) => {
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
              {user?.name} · {roleLabel(user?.role)}
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
          {visibleNav.map((n) => {
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

const hubButtons: NavItem[] = [
  { to: '/admin/collection-prices', label: 'Установка цен', icon: Table2, roles: ['ADMIN'] },
  { to: '/admin/prospects', label: 'Наработки', icon: ClipboardList },
  { to: '/admin/leads', label: 'Заявки', icon: Inbox },
];

export function AdminDashboard() {
  const { user } = useAuth();
  const buttons = hubButtons.filter((btn) => {
    if (!btn.roles?.length) return true;
    return user?.role ? btn.roles.includes(user.role) : false;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-graphite sm:text-3xl">Панель управления</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {buttons.map((btn) => {
            const Icon = btn.icon;
            return (
              <Link
                key={btn.to}
                to={btn.to}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-graphite/15 bg-white px-3 text-sm font-semibold text-graphite transition hover:border-brand hover:text-brand"
              >
                <Icon size={15} strokeWidth={1.75} className="text-brand" />
                {btn.label}
              </Link>
            );
          })}
        </div>
      </div>
      <AdminOpsDashboard />
    </div>
  );
}
