import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../store/cart';

type Props = {
  onSearch: () => void;
};

const glassBase =
  'relative grid aspect-square h-[3.35rem] w-[3.35rem] place-items-center rounded-2xl border shadow-[0_10px_28px_rgba(15,40,20,0.16)] backdrop-blur-md transition active:scale-95 sm:h-14 sm:w-14';

const glassIdle = `${glassBase} border-white/55 bg-white/45 text-graphite/70 hover:border-brand/35 hover:bg-white/70 hover:text-brand`;
const glassActive = `${glassBase} border-brand/40 bg-white/75 text-brand`;

export function MobileBottomNav({ onSearch }: Props) {
  const { count } = useCart();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] md:hidden"
      aria-label="Нижнее меню"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-end justify-center gap-2.5 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 sm:gap-3">
        <NavLink to="/" end aria-label="Главная" className={({ isActive }) => (isActive ? glassActive : glassIdle)}>
          {({ isActive }) => <Home size={24} strokeWidth={isActive ? 2.25 : 1.85} />}
        </NavLink>

        <NavLink
          to="/catalog"
          aria-label="Каталог"
          className={({ isActive }) => (isActive ? glassActive : glassIdle)}
        >
          {({ isActive }) => <LayoutGrid size={24} strokeWidth={isActive ? 2.25 : 1.85} />}
        </NavLink>

        <NavLink to="/cart" aria-label="Корзина" className={({ isActive }) => (isActive ? glassActive : glassIdle)}>
          {({ isActive }) => (
            <>
              <ShoppingCart size={24} strokeWidth={isActive ? 2.25 : 1.85} />
              {count > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-sm">
                  {count}
                </span>
              ) : null}
            </>
          )}
        </NavLink>

        <button type="button" onClick={onSearch} aria-label="Поиск" className={glassIdle}>
          <Search size={24} strokeWidth={1.85} />
        </button>
      </div>
    </nav>
  );
}
