import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Menu, Percent, Search, ShoppingCart, X, MapPin, Phone } from 'lucide-react';
import { useCart } from '../store/cart';
import { useFavorites } from '../store/favorites';
import { useCity } from '../store/city';
import { api } from '../lib/api';
import { SmartImage } from './SmartImage';
import type { Category, Promotion } from '../types';

const links = [
  { to: '/catalog', label: 'Весь каталог' },
  { to: '/services', label: 'Услуги' },
  { to: '/works', label: 'Наши работы' },
  { to: '/stores', label: 'Магазины' },
  { to: '/contacts', label: 'Контакты' },
  { to: '/picker', label: 'Подбор покрытия' },
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

      <div className="container-dp flex items-center gap-3 py-3 lg:gap-6">
        <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Меню каталога">
          <Menu />
        </button>

        <Link to="/" className="font-display text-xl font-bold tracking-tight text-brand-dark sm:text-2xl">
          ДОМПОЛА
        </Link>

        <nav className="ml-2 hidden items-center gap-5 lg:flex">
          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              `text-sm font-medium transition hover:text-brand ${isActive ? 'text-brand' : 'text-graphite/80'}`
            }
          >
            Каталог
          </NavLink>
          <NavLink
            to="/promotions"
            className={({ isActive }) =>
              `text-sm font-medium transition hover:text-brand ${isActive ? 'text-brand' : 'text-graphite/80'}`
            }
          >
            Акции
          </NavLink>
          {links.slice(1).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition hover:text-brand ${isActive ? 'text-brand' : 'text-graphite/80'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden min-w-[220px] flex-1 max-w-md md:flex">
          <div className="flex w-full items-center gap-2 rounded-md border border-graphite/12 bg-mist px-3 py-2">
            <Search size={16} className="text-graphite/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по каталогу"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link to="/favorites" className="relative rounded-md p-2 hover:bg-mist" aria-label="Избранное">
            <Heart size={20} />
            {favCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] text-white">
                {favCount}
              </span>
            ) : null}
          </Link>
          <Link to="/cart" className="relative rounded-md p-2 hover:bg-mist" aria-label="Корзина">
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
            <div className="fixed inset-0 z-[9999] lg:hidden" role="dialog" aria-modal="true" aria-label="Каталог">
              <div className="absolute inset-0 bg-ink/60" onClick={close} />
              <div className="absolute inset-y-0 left-0 flex h-full w-[90%] max-w-sm flex-col bg-white shadow-2xl">
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
                    {categories.length ? (
                      <div className="grid gap-2">
                        {categories.map((c) => (
                          <Link
                            key={c.id}
                            to={`/catalog/${c.slug}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-xl border border-graphite/8 bg-white p-2 pr-3 transition active:bg-mist"
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                              <SmartImage src={c.image} alt={c.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold leading-snug text-graphite">{c.name}</div>
                              {c.description ? (
                                <div className="mt-0.5 line-clamp-1 text-xs text-graphite/50">{c.description}</div>
                              ) : null}
                            </div>
                            <ChevronRight size={16} className="shrink-0 text-graphite/30" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        to="/catalog"
                        onClick={close}
                        className="block rounded-xl bg-mist px-4 py-3 text-sm font-medium text-brand"
                      >
                        Открыть каталог
                      </Link>
                    )}
                  </section>

                  <section className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-graphite/50">
                        <Percent size={12} className="text-brand" />
                        Акции и скидки
                      </h2>
                      <Link to="/promotions" onClick={close} className="text-xs font-semibold text-brand">
                        Все
                      </Link>
                    </div>
                    {promotions.length ? (
                      <div className="grid gap-2">
                        {promotions.map((p) => (
                          <Link
                            key={p.id}
                            to="/promotions"
                            onClick={close}
                            className="relative overflow-hidden rounded-xl"
                          >
                            <div className="aspect-[16/7] bg-mist">
                              <SmartImage
                                src={p.image}
                                alt={p.title}
                                className="h-full w-full object-cover"
                                fallback="images/promo.jpg"
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                              {p.discountPercent ? (
                                <span className="mb-1 inline-block rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold">
                                  −{p.discountPercent}%
                                </span>
                              ) : null}
                              <div className="font-semibold leading-snug">{p.title}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        to="/promotions"
                        onClick={close}
                        className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand"
                      >
                        <Percent size={16} />
                        Смотреть акции
                      </Link>
                    )}
                  </section>

                  <section className="border-t border-graphite/10 pt-4">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite/50">Разделы</h2>
                    <div className="grid gap-0.5">
                      {links.map((l) => (
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
                    </div>
                  </section>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
