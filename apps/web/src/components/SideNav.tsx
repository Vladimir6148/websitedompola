import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Info,
  Layers,
  Leaf,
  LayoutGrid,
  MapPin,
  Tag,
  Truck,
  Wrench,
} from 'lucide-react';
import { useCity } from '../store/city';

const FLOORING = [
  { to: '/catalog/laminate', label: 'Ламинат' },
  { to: '/catalog/quartzvinyl-spc', label: 'Кварцвинил / SPC' },
  { to: '/catalog/mspc', label: 'MSPC' },
  { to: '/catalog/parquet', label: 'Паркет' },
  { to: '/catalog/porcelain', label: 'Керамогранит' },
  { to: '/catalog/linoleum', label: 'Линолеум' },
  { to: '/catalog/underlayment', label: 'Подложка' },
  { to: '/catalog/accessories', label: 'Комплектующие' },
];

const SECONDARY = [
  { to: '/services', label: 'Услуги', icon: Wrench },
  { to: '/picker', label: 'Подборки', icon: LayoutGrid },
  { to: '/promotions', label: 'Акции', icon: Tag },
  { to: '/works', label: 'О компании', icon: Info },
  { to: '/contacts', label: 'Контакты', icon: MapPin },
];

const STORES = ['Архангельск', 'Северодвинск', 'Вологда'];

type SideNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SideNav({ onNavigate, className = '' }: SideNavProps) {
  const { pathname } = useLocation();
  const { cities, city, setCityId } = useCity();
  const [cityOpen, setCityOpen] = useState(false);
  const flooringActive = pathname.startsWith('/catalog') || pathname.startsWith('/product');

  function go() {
    onNavigate?.();
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition',
      isActive ? 'bg-mist text-brand' : 'text-graphite hover:bg-mist/80 hover:text-brand',
    ].join(' ');

  return (
    <div className={`flex h-full flex-col bg-white ${className}`}>
      <div className="relative flex h-[4.25rem] shrink-0 items-center border-b border-graphite/8 px-4">
        <button
          type="button"
          onClick={() => setCityOpen((v) => !v)}
          className="flex w-full items-center gap-2 text-left text-[15px] font-semibold text-graphite"
          aria-expanded={cityOpen}
        >
          <MapPin size={18} className="shrink-0 text-brand" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 truncate">{city?.name || 'Выберите город'}</span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-graphite/40 transition ${cityOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {cityOpen ? (
          <div className="absolute left-3 right-3 top-full z-20 mt-1 overflow-hidden rounded-xl border border-graphite/10 bg-white shadow-lg">
            {cities.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCityId(c.id);
                  setCityOpen(false);
                }}
                className={`block w-full px-3 py-2.5 text-left text-sm transition hover:bg-mist ${
                  c.id === city?.id ? 'font-semibold text-brand' : 'text-graphite'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <nav className="flex flex-col gap-0.5">
          <NavLink to="/" end onClick={go} className={linkClass}>
            {({ isActive }) => (
              <>
                <Home size={18} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0" />
                Главная
              </>
            )}
          </NavLink>

          <div className="mt-1">
            <Link
              to="/catalog"
              onClick={go}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition ${
                flooringActive ? 'text-graphite' : 'text-graphite hover:bg-mist/80 hover:text-brand'
              }`}
            >
              <Layers size={18} strokeWidth={1.75} className="shrink-0" />
              Напольные покрытия
            </Link>
            <div className="mt-0.5 ml-2 space-y-0.5 border-l border-graphite/10 pl-2">
              {FLOORING.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={go}
                    className={`flex items-center justify-between rounded-lg py-2 pl-3 pr-2 text-[14px] transition ${
                      active
                        ? 'bg-mist font-semibold text-brand shadow-[inset_3px_0_0_0_var(--color-brand)]'
                        : 'text-graphite/80 hover:bg-mist/70 hover:text-brand'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active ? <ChevronRight size={14} className="shrink-0 opacity-70" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="my-3 border-t border-graphite/10" />

        <nav className="flex flex-col gap-0.5">
          {SECONDARY.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={go} className={linkClass}>
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 space-y-3 pb-4">
          <Link
            to="/contacts"
            onClick={go}
            className="block rounded-2xl bg-[#e8f5ec] p-3.5 transition hover:bg-[#dcefe3]"
          >
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand">
                <Truck size={18} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-snug text-graphite">
                  Быстрая доставка по региону
                </div>
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Подробнее <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </Link>

          <div className="px-1">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-graphite">
              <MapPin size={16} className="text-brand" />
              Наши магазины
            </div>
            <ul className="space-y-1 text-sm text-graphite/70">
              {STORES.map((name) => (
                <li key={name}>— {name}</li>
              ))}
            </ul>
            <Link
              to="/stores"
              onClick={go}
              className="mt-2 inline-flex text-sm font-semibold text-brand hover:underline"
            >
              На карте
            </Link>
          </div>

          <div className="rounded-2xl bg-brand-dark p-3.5 text-white">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
                <Leaf size={18} strokeWidth={1.75} />
              </span>
              <p className="text-sm font-bold leading-snug">
                Гарантия качества от проверенных производителей
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
