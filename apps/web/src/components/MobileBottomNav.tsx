import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../store/cart';

type Props = {
  onSearch: () => void;
};

export function MobileBottomNav({ onSearch }: Props) {
  const { count } = useCart();

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    [
      'relative flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold tracking-wide transition',
      isActive ? 'text-brand' : 'text-graphite/50',
    ].join(' ');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-graphite/10 bg-white pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,40,20,0.08)] md:hidden"
      aria-label="Нижнее меню"
    >
      <div className="mx-auto flex h-[3.75rem] max-w-lg items-stretch px-1">
        <NavLink to="/" end className={itemClass}>
          {({ isActive }) => (
            <>
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl transition ${
                  isActive ? 'bg-brand/12 text-brand' : 'text-graphite/50'
                }`}
              >
                <Home size={22} strokeWidth={isActive ? 2.25 : 1.75} />
              </span>
              <span>Главная</span>
            </>
          )}
        </NavLink>

        <NavLink to="/catalog" className={itemClass}>
          {({ isActive }) => (
            <>
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl transition ${
                  isActive ? 'bg-brand/12 text-brand' : 'text-graphite/50'
                }`}
              >
                <LayoutGrid size={22} strokeWidth={isActive ? 2.25 : 1.75} />
              </span>
              <span>Каталог</span>
            </>
          )}
        </NavLink>

        <NavLink to="/cart" className={itemClass}>
          {({ isActive }) => (
            <>
              <span
                className={`relative grid h-8 w-8 place-items-center rounded-xl transition ${
                  isActive ? 'bg-brand/12 text-brand' : 'text-graphite/50'
                }`}
              >
                <ShoppingCart size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                {count > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                    {count}
                  </span>
                ) : null}
              </span>
              <span>Корзина</span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          onClick={onSearch}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold tracking-wide text-graphite/50 transition active:text-brand"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl text-graphite/50 transition active:bg-brand/12 active:text-brand">
            <Search size={22} strokeWidth={1.75} />
          </span>
          <span>Поиск</span>
        </button>
      </div>
    </nav>
  );
}
