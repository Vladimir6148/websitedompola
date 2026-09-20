import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../store/cart';

type Props = {
  onSearch: () => void;
};

const itemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition',
    isActive ? 'text-brand' : 'text-graphite/55',
  ].join(' ');

export function MobileBottomNav({ onSearch }: Props) {
  const { count } = useCart();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-graphite/10 bg-[#f3f3f3]/safe pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Нижнее меню"
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch">
        <NavLink to="/" end className={itemClass}>
          <Home size={22} strokeWidth={1.75} />
          <span>Главная</span>
        </NavLink>

        <NavLink to="/catalog" className={itemClass}>
          <span className="relative">
            <LayoutGrid size={22} strokeWidth={1.75} />
            <Search size={11} strokeWidth={2.5} className="absolute -bottom-0.5 -right-1" />
          </span>
          <span>Каталог</span>
        </NavLink>

        <NavLink to="/cart" className={itemClass}>
          <span className="relative">
            <ShoppingCart size={22} strokeWidth={1.75} />
            {count > 0 ? (
              <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </span>
          <span>Корзина</span>
        </NavLink>

        <button
          type="button"
          onClick={onSearch}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium text-graphite/55 transition active:text-brand"
        >
          <Search size={22} strokeWidth={1.75} />
          <span>Поиск</span>
        </button>
      </div>
    </nav>
  );
}
