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
        <div className="container-dp flex min-w-0 items-center gap-1.5 py-2.5 sm:gap-2.5 sm:py-3 lg:gap-3">
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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

          <form onSubmit={onSearch} className="hidden w-[13rem] shrink-0 md:block lg:w-[16rem] xl:w-[18rem]">
            <label className="flex h-9 items-center gap-2 rounded-full border border-graphite/20 bg-mist/80 px-3 transition focus-within:border-brand focus-within:bg-white sm:h-10 sm:px-3.5">
              <Search size={16} strokeWidth={1.75} className="shrink-0 text-graphite/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="напольные покрытия"
                aria-label="Поиск напольных покрытий"
                className="min-w-0 w-full bg-transparent text-sm text-graphite outline-none placeholder:text-graphite/40"
              />
            </label>
          </form>

          <nav className="ml-auto hidden shrink-0 items-center gap-2 xl:flex">
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
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 xl:ml-0">
            <a
              href="https://vk.com/dompola29"
              target="_blank"
              rel="noreferrer"
              aria-label="Группа ВКонтакте"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-graphite/20 bg-white text-[#0077FF] transition hover:border-[#0077FF] hover:bg-[#0077FF] hover:text-white sm:h-10 sm:w-10"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                <path d="M12.78 16.5h1.2s.36-.04.54-.24c.17-.19.16-.55.16-.55s-.02-1.68.76-1.93c.76-.24 1.74 1.63 2.78 2.35.78.55 1.37.43 1.37.43l2.75-.04s1.44-.09.76-1.22c-.06-.09-.4-.84-2.05-2.37-1.73-1.6-1.5-1.34.58-4.11.1-.17 2.49-4.1 2.49-4.1.14-.27-.04-.42-.04-.42h-2.86s-.42.01-.72.2c-.29.18-.47.6-.47.6s-.85 2.27-1.98 3.74c-1.2 1.56-1.68 1.64-1.88 1.55-.46-.22-.34-.87-.34-1.34V7.9c0-.37-.11-.6-.4-.72-.23-.09-.54-.12-1.1.01-.86.2-1.42.65-1.42.65s-.5.35-.14.35c.4 0 .65.19.89.63.3.55.29 1.78.29 1.78s.02 1.05-.24 1.2c-.18.1-.42-.1-1.06-.94-1.04-1.37-1.77-3.6-1.77-3.6s-.15-.36-.41-.55c-.25-.18-.6-.24-.6-.24H5.56s-.5.01-.68.23c-.16.2-.01.61-.01.61s4.01 9.36 8.56 9.36z" />
              </svg>
            </a>
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
                          placeholder="напольные покрытия"
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
