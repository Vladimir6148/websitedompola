import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingCart, X, MapPin, Phone } from 'lucide-react';
import { useCart } from '../store/cart';
import { useFavorites } from '../store/favorites';
import { useCity } from '../store/city';
import { api } from '../lib/api';
import type { Category } from '../types';

const links = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/services', label: 'Услуги' },
  { to: '/promotions', label: 'Акции' },
  { to: '/works', label: 'Наши работы' },
  { to: '/stores', label: 'Магазины' },
  { to: '/contacts', label: 'Контакты' },
];

export function Header() {
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { cities, city, setCityId } = useCity();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api<Category[]>('/api/categories').then(setCategories).catch(() => undefined);
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate(`/catalog?q=${encodeURIComponent(q.trim())}`);
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
        <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Меню">
          <Menu />
        </button>

        <Link to="/" className="font-display text-xl font-bold tracking-tight text-brand-dark sm:text-2xl">
          ДОМПОЛА
        </Link>

        <nav className="ml-2 hidden items-center gap-5 lg:flex">
          {links.map((l) => (
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

      {open ? (
        <div className="fixed inset-0 z-[60] bg-ink/50 lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="h-full w-[86%] max-w-sm bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-xl font-bold text-brand-dark">ДОМПОЛА</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X />
              </button>
            </div>
            <form onSubmit={onSearch} className="mb-5">
              <div className="flex items-center gap-2 rounded-md border border-graphite/12 bg-mist px-3 py-2">
                <Search size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Поиск"
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </form>
            <div className="space-y-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium hover:bg-mist"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 border-t border-graphite/10 pt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-graphite/50">Категории</p>
              <div className="grid gap-1">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/catalog/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm hover:bg-mist"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
