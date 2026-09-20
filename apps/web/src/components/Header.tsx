import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Heart,
  MapPin,
  Menu,
  Percent,
  Phone,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useCart } from '../store/cart';
import { useFavorites } from '../store/favorites';
import { useCity } from '../store/city';
import { api } from '../lib/api';
import { SmartImage } from './SmartImage';
import type { Category, Promotion } from '../types';

const navLinks = [
  { to: '/services', label: 'Услуги' },
  { to: '/promotions', label: 'Акции' },
  { to: '/works', label: 'Наши работы' },
  { to: '/stores', label: 'Магазины' },
  { to: '/contacts', label: 'Контакты' },
];

const mobileExtraLinks = [
  { to: '/catalog', label: 'Весь каталог' },
  { to: '/picker', label: 'Подбор покрытия' },
  ...navLinks,
];

export function Header() {
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { cities, city, setCityId } = useCity();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api<Category[]>('/api/categories').then(setCategories).catch(() => undefined);
    api<Promotion[]>('/api/promotions').then(setPromotions).catch(() => undefined);
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

  const catalogPanel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Каталог">
            <div className="absolute inset-0 bg-ink/55" onClick={close} />

            {/* Mobile drawer */}
            <div className="absolute inset-y-0 left-0 flex h-full w-[90%] max-w-sm flex-col bg-white text-graphite shadow-2xl lg:hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-graphite/8 px-4 py-4">
                <span className="font-display text-xl font-bold text-brand-dark">Каталог</span>
                <button type="button" onClick={close} aria-label="Закрыть" className="rounded-md p-1 hover:bg-mist">
                  <X />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <form onSubmit={onSearch} className="mb-5">
                  <div className="flex items-center gap-2 rounded-md border border-graphite/12 bg-mist px-3 py-2.5">
                    <Search size={16} className="text-graphite/40" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Поиск по каталогу"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </form>

                <section className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-graphite/50">Виды покрытий</h2>
                    <Link to="/catalog" onClick={close} className="text-xs font-semibold text-brand">
                      Все
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        to={`/catalog/${c.slug}`}
                        onClick={close}
                        className="flex items-center gap-3 rounded-xl border border-graphite/8 p-2 pr-3 active:bg-mist"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                          <SmartImage src={c.image} alt={c.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 font-semibold">{c.name}</div>
                        <ChevronRight size={16} className="text-graphite/30" />
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="mb-6">
                  <h2 className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-graphite/50">
                    <Percent size={12} className="text-brand" /> Акции
                  </h2>
                  <div className="grid gap-2">
                    {promotions.map((p) => (
                      <Link key={p.id} to="/promotions" onClick={close} className="relative overflow-hidden rounded-xl">
                        <div className="aspect-[16/7] bg-mist">
                          <SmartImage src={p.image} alt={p.title} className="h-full w-full object-cover" fallback="images/promo.jpg" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                          {p.discountPercent ? (
                            <span className="mb-1 inline-block rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold">
                              −{p.discountPercent}%
                            </span>
                          ) : null}
                          <div className="font-semibold">{p.title}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="border-t border-graphite/10 pt-4">
                  {mobileExtraLinks.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={close}
                      className="flex items-center justify-between rounded-md px-2 py-3 text-sm font-medium hover:bg-mist"
                    >
                      {l.label}
                      <ChevronRight size={14} className="text-graphite/30" />
                    </Link>
                  ))}
                </section>
              </div>
            </div>

            {/* Desktop mega panel */}
            <div className="absolute left-1/2 top-28 hidden w-[min(960px,92vw)] -translate-x-1/2 rounded-2xl bg-white p-6 text-graphite shadow-2xl lg:block">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-brand-dark">Каталог</h2>
                <button type="button" onClick={close} aria-label="Закрыть">
                  <X />
                </button>
              </div>
              <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite/50">Виды покрытий</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        to={`/catalog/${c.slug}`}
                        onClick={close}
                        className="flex items-center gap-3 rounded-xl border border-graphite/8 p-2 hover:bg-mist"
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-mist">
                          <SmartImage src={c.image} alt={c.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-semibold">{c.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite/50">Акции</p>
                  <div className="grid gap-2">
                    {promotions.slice(0, 4).map((p) => (
                      <Link key={p.id} to="/promotions" onClick={close} className="rounded-xl border border-graphite/8 p-3 hover:bg-mist">
                        <div className="font-semibold">{p.title}</div>
                        {p.discountPercent ? <div className="text-sm text-brand">−{p.discountPercent}%</div> : null}
                      </Link>
                    ))}
                    <Link to="/catalog" onClick={close} className="btn-primary mt-2 justify-center">
                      Весь каталог
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <header className="sticky top-0 z-50 text-white">
      <div
        className="relative overflow-hidden border-b border-white/10"
        style={{
          background:
            'radial-gradient(120% 180% at 50% -40%, #1a5c32 0%, #0b2416 42%, #06140c 100%)',
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#1f8a3d]/35 to-transparent md:w-40" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#1f8a3d]/35 to-transparent md:w-40" aria-hidden />
        <div className="pointer-events-none absolute -left-8 top-0 h-full w-16 -skew-x-12 bg-[#2db85a]/25 md:w-24" aria-hidden />
        <div className="pointer-events-none absolute -right-8 top-0 h-full w-16 skew-x-12 bg-[#2db85a]/25 md:w-24" aria-hidden />

        <div className="relative container-dp flex items-center gap-3 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1f8a3d] to-[#2db85a] px-3 py-2 text-sm font-semibold shadow-[0_0_20px_rgba(45,184,90,0.35)]"
            aria-label="Каталог"
          >
            <Menu size={16} />
            Каталог
          </button>
          <Link to="/" className="mx-auto flex flex-col items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#3dff7a] shadow-[0_0_18px_rgba(61,255,122,0.45)]">
              <span className="text-[9px] font-extrabold tracking-wide">ДОМПОЛА</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/favorites" className="rounded-full border border-white/25 p-2" aria-label="Избранное">
              <Heart size={16} />
            </Link>
            <Link to="/cart" className="relative rounded-full border border-white/25 p-2" aria-label="Корзина">
              <ShoppingCart size={16} />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#3dff7a] px-1 text-[10px] font-bold text-[#06140c]">
                {count}
              </span>
            </Link>
          </div>
        </div>

        <div className="relative container-dp hidden pb-4 pt-3 lg:block">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-white/85">
              <MapPin size={15} className="text-[#3dff7a]" />
              {cities.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCityId(c.id)}
                  className={`inline-flex items-center gap-1 transition hover:text-white ${
                    city?.id === c.id ? 'font-semibold text-white' : 'text-white/70'
                  }`}
                >
                  {c.name}
                  {i === 0 ? <ChevronDown size={14} className="opacity-70" /> : null}
                  {i < cities.length - 1 ? <span className="ml-2 text-white/35">·</span> : null}
                </button>
              ))}
            </div>

            <Link to="/" className="relative z-10 -mb-8 flex flex-col items-center justify-center">
              <span className="grid h-[88px] w-[88px] place-items-center rounded-full border-[3px] border-[#3dff7a] bg-[#0b2416] shadow-[0_0_28px_rgba(61,255,122,0.55)]">
                <span className="font-sans text-sm font-extrabold tracking-[0.04em]">ДОМПОЛА</span>
              </span>
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
                Напольные покрытия
              </span>
            </Link>

            <div className="flex items-center justify-end gap-2 pt-1 text-sm">
              <a href="tel:+79212494979" className="inline-flex items-center gap-2 font-medium hover:text-[#3dff7a]">
                <Phone size={15} className="text-[#3dff7a]" />
                +7 921 249-49-79
              </a>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#178a3a] to-[#2db85a] px-5 py-2.5 text-sm font-semibold shadow-[0_0_22px_rgba(45,184,90,0.4)] transition hover:brightness-110"
              >
                <Menu size={16} />
                Каталог
                <ChevronDown size={14} />
              </button>
              <nav className="hidden items-center gap-4 xl:flex">
                {navLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      `text-sm transition hover:text-[#3dff7a] ${isActive ? 'text-[#3dff7a]' : 'text-white/90'}`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <form onSubmit={onSearch} className="mx-2 max-w-xl justify-self-stretch xl:mx-6">
              <div className="flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 py-2.5 backdrop-blur-sm">
                <Search size={16} className="text-white/55" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Поиск по каталогу"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                />
              </div>
            </form>

            <div className="flex items-center gap-2 justify-self-end">
              <Link
                to="/favorites"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-white/30 transition hover:border-[#3dff7a] hover:text-[#3dff7a]"
                aria-label="Избранное"
              >
                <Heart size={18} />
                {favCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#3dff7a] px-1 text-[10px] font-bold text-[#06140c]">
                    {favCount}
                  </span>
                ) : null}
              </Link>
              <Link
                to="/cart"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-white/30 transition hover:border-[#3dff7a] hover:text-[#3dff7a]"
                aria-label="Корзина"
              >
                <ShoppingCart size={18} />
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#3dff7a] px-1 text-[10px] font-bold text-[#06140c]">
                  {count}
                </span>
              </Link>
              <Link
                to="/admin"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/30 transition hover:border-[#3dff7a] hover:text-[#3dff7a]"
                aria-label="Личный кабинет"
              >
                <User size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {catalogPanel}
    </header>
  );
}
