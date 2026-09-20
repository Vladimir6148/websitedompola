import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  MapPin,
  Percent,
  Phone,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { useCart } from '../store/cart';
import { api } from '../lib/api';
import { MobileBottomNav } from './MobileBottomNav';
import type { Category } from '../types';

const primaryLinks = [
  { to: '/', label: 'Главная' },
  { to: '/catalog', label: 'Напольные покрытия' },
  { to: '/catalog/accessories', label: 'Аксессуары' },
  { to: '/services', label: 'Услуги' },
  { to: '/promotions', label: 'Подборки' },
];

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/';


  useEffect(() => {
    api<Category[]>('/api/categories').then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate(`/catalog?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  }

  function close() {
    setOpen(false);
  }

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-graphite/8 bg-white/95 backdrop-blur">
      <div className="container-dp flex min-w-0 items-center gap-1.5 py-2.5 sm:gap-3 sm:py-3 lg:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!isHome ? (
            <Link
              to="/"
              aria-label="Главная"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-graphite/20 bg-white text-graphite transition hover:border-brand hover:text-brand sm:h-10 sm:w-10"
            >
              <Home size={18} strokeWidth={1.75} />
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Открыть каталог"
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-graphite/20 bg-white px-2.5 text-xs font-semibold text-graphite transition hover:border-brand hover:text-brand sm:h-10 sm:px-3.5 sm:text-sm"
          >
            Каталог
          </button>

          <Link
            to="/promotions"
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-graphite/20 bg-white px-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 sm:h-10 sm:gap-1.5 sm:px-3.5 sm:text-sm"
          >
            <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white sm:h-5 sm:w-5">
              <Percent size={10} strokeWidth={2.5} />
            </span>
            <span>Акции</span>
          </Link>
        </div>

        {!isHome ? (
          <Link
            to="/"
            className="hidden shrink-0 px-2 text-sm font-bold tracking-wide text-graphite transition hover:text-brand sm:inline"
          >
            ДОМПОЛА
          </Link>
        ) : null}

        <nav className="ml-1 hidden items-center gap-2 lg:flex">
          {!isHome ? (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? 'border-brand bg-brand text-white'
                    : 'border-graphite/20 text-graphite hover:border-brand hover:text-brand'
                }`
              }
            >
              Главная
            </NavLink>
          ) : null}
          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-brand bg-brand text-white'
                  : 'border-graphite/20 text-graphite hover:border-brand hover:text-brand'
              }`
            }
          >
            Каталог
          </NavLink>
          <NavLink
            to="/stores"
            className={({ isActive }) =>
              `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-brand bg-brand text-white'
                  : 'border-graphite/20 text-graphite hover:border-brand hover:text-brand'
              }`
            }
          >
            Магазины
          </NavLink>
          <NavLink
            to="/contacts"
            className={({ isActive }) =>
              `hidden rounded-full border px-3.5 py-1.5 text-sm font-semibold transition xl:inline-flex ${
                isActive
                  ? 'border-brand bg-brand text-white'
                  : 'border-graphite/20 text-graphite hover:border-brand hover:text-brand'
              }`
            }
          >
            Контакты
          </NavLink>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <a
            href="tel:+79214994979"
            aria-label="Позвонить"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-graphite/20 bg-white text-graphite transition hover:border-brand hover:text-brand sm:h-10 sm:w-10"
          >
            <Phone size={18} strokeWidth={1.75} />
          </a>
          <Link
            to="/stores"
            aria-label="Магазины на карте"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-graphite/20 bg-white text-graphite transition hover:border-brand hover:text-brand sm:h-10 sm:w-10"
          >
            <MapPin size={18} strokeWidth={1.75} />
          </Link>
          <Link
            to="/cart"
            aria-label="Корзина"
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-graphite/20 bg-white text-graphite transition hover:border-brand hover:text-brand sm:h-10 sm:w-10"
          >
            <ShoppingCart size={18} strokeWidth={1.75} />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Каталог">
              <button type="button" className="absolute inset-0 bg-ink/55" aria-label="Закрыть" onClick={close} />
              <div className="absolute inset-y-0 left-0 flex h-full w-[88%] max-w-sm translate-x-0 flex-col bg-white shadow-2xl">
                <div className="shrink-0 px-4 pb-3 pt-4">
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Назад"
                    className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-mist text-graphite transition hover:bg-graphite/10"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <form onSubmit={onSearch}>
                    <div className="flex items-center gap-2 rounded-xl border border-graphite/15 px-3 py-2.5">
                      <Search size={16} className="shrink-0 text-graphite/35" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Поиск"
                        className="w-full bg-transparent text-[15px] outline-none placeholder:text-graphite/40"
                      />
                    </div>
                  </form>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
                  <nav className="flex flex-col gap-1 py-2">
                    {primaryLinks.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={close}
                        className="rounded-lg px-1 py-2.5 text-[17px] font-bold text-graphite transition hover:text-brand"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="my-3 border-t border-graphite/12" />

                  <nav className="flex flex-col">
                    {categories.length ? (
                      categories.map((c) => (
                        <Link
                          key={c.id}
                          to={`/catalog/${c.slug}`}
                          onClick={close}
                          className="rounded-lg px-1 py-2.5 text-[15px] text-graphite transition hover:bg-mist hover:text-brand"
                        >
                          {c.name}
                        </Link>
                      ))
                    ) : (
                      <Link
                        to="/catalog"
                        onClick={close}
                        className="rounded-lg px-1 py-2.5 text-[15px] text-brand"
                      >
                        Весь каталог
                      </Link>
                    )}
                  </nav>

                  <div className="my-3 border-t border-graphite/12" />

                  <nav className="flex flex-col">
                    {[
                      { to: '/works', label: 'Наши работы' },
                      { to: '/stores', label: 'Магазины' },
                      { to: '/contacts', label: 'Контакты' },
                      { to: '/picker', label: 'Подбор покрытия' },
                    ].map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={close}
                        className="rounded-lg px-1 py-2.5 text-[15px] text-graphite/80 transition hover:bg-mist hover:text-brand"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
    <MobileBottomNav onSearch={() => setOpen(true)} />
    </>
  );
}
