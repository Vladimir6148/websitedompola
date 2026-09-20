import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Percent,
  Phone,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { useCart } from '../store/cart';
import { useFavorites } from '../store/favorites';
import { useCity } from '../store/city';
import { api } from '../lib/api';
import type { Category } from '../types';

const primaryLinks = [
  { to: '/catalog', label: 'Напольные покрытия' },
  { to: '/catalog/accessories', label: 'Аксессуары' },
  { to: '/services', label: 'Услуги' },
  { to: '/promotions', label: 'Подборки' },
];

const navPills = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/promotions', label: 'Акции', accent: true },
  { to: '/services', label: 'Услуги' },
];

export function Header() {
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { cities, city, setCityId } = useCity();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Category[]>('/api/categories').then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 180);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
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
    <header className="sticky top-0 z-50 border-b border-graphite/8 bg-white/95 backdrop-blur">
      <div className="bg-graphite text-white">
        <div className="container-dp flex items-center justify-between gap-4 py-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-brand" />
            <select
              value={city?.id || ''}
              onChange={(e) => setCityId(e.target.value)}
              className="bg-transparent outline-none"
              aria-label="Город"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id} className="text-graphite">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <a href="tel:+78182650000" className="inline-flex items-center gap-2 hover:text-brand">
            <Phone size={14} />
            <span className="hidden sm:inline">+7 (8182) 65-00-00</span>
            <span className="sm:hidden">Позвонить</span>
          </a>
        </div>
      </div>

      <div className="container-dp flex items-center gap-2 py-3 sm:gap-3 lg:gap-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть каталог и поиск"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-graphite/20 text-graphite transition hover:border-brand hover:text-brand"
        >
          <span className="relative inline-flex items-center">
            <span className="mr-0.5 flex flex-col gap-[2.5px]" aria-hidden>
              <span className="block h-[1.5px] w-2.5 rounded-full bg-current" />
              <span className="block h-[1.5px] w-2 rounded-full bg-current" />
              <span className="block h-[1.5px] w-1.5 rounded-full bg-current" />
            </span>
            <Search size={15} strokeWidth={2.25} />
          </span>
        </button>

        <Link to="/" className="shrink-0 font-display text-xl font-bold tracking-tight text-brand-dark sm:text-2xl">
          ДОМПОЛА
        </Link>

        <nav className="ml-1 hidden items-center gap-2 md:flex">
          {navPills.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
                  item.accent
                    ? isActive
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-rose-400/70 text-rose-600 hover:bg-rose-50'
                    : isActive
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-graphite/20 text-graphite hover:border-brand hover:text-brand',
                ].join(' ')
              }
            >
              {item.accent ? <Percent size={14} className="text-rose-500" /> : null}
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/stores"
            className={({ isActive }) =>
              `hidden rounded-full border px-3.5 py-1.5 text-sm font-semibold transition lg:inline-flex ${
                isActive
                  ? 'border-brand bg-brand/5 text-brand'
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
                  ? 'border-brand bg-brand/5 text-brand'
                  : 'border-graphite/20 text-graphite hover:border-brand hover:text-brand'
              }`
            }
          >
            Контакты
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link to="/favorites" className="relative rounded-full p-2 hover:bg-mist" aria-label="Избранное">
            <Heart size={20} />
            {favCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] text-white">
                {favCount}
              </span>
            ) : null}
          </Link>
          <Link to="/cart" className="relative rounded-full p-2 hover:bg-mist" aria-label="Корзина">
            <ShoppingCart size={20} />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] text-white">
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
                        ref={searchInputRef}
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
  );
}
