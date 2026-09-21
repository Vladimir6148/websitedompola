import { NavLink } from 'react-router-dom';
import { ArrowLeft, Home, LayoutGrid, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../store/cart';
import { useGoBack } from './BackButton';

type Props = {
  onSearch: () => void;
};

const glassBase =
  'relative grid aspect-square w-full max-w-[4.25rem] place-items-center rounded-2xl border shadow-[0_12px_32px_rgba(15,40,20,0.2)] backdrop-blur-md transition active:scale-95';

const glassIdle = `${glassBase} border-white/80 bg-white/75 text-graphite hover:border-brand/50 hover:bg-white/90 hover:text-brand`;
const glassActive = `${glassBase} border-brand/45 bg-white/90 text-brand`;

export function MobileBottomNav({ onSearch }: Props) {
  const { count } = useCart();
  const goBack = useGoBack('/');

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] md:hidden"
      aria-label="Нижнее меню"
    >
      <div className="pointer-events-auto mx-auto flex w-full items-end justify-between gap-2 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 sm:gap-3 sm:px-4">
        <button type="button" onClick={goBack} aria-label="Назад" className={glassIdle}>
          <ArrowLeft size={26} strokeWidth={2.15} className="text-brand" />
        </button>

        <NavLink to="/" end aria-label="Главная" className={({ isActive }) => (isActive ? glassActive : glassIdle)}>
          {({ isActive }) => <Home size={26} strokeWidth={isActive ? 2.3 : 1.9} />}
        </NavLink>

        <NavLink
          to="/catalog"
          aria-label="Каталог"
          className={({ isActive }) => (isActive ? glassActive : glassIdle)}
        >
          {({ isActive }) => <LayoutGrid size={26} strokeWidth={isActive ? 2.3 : 1.9} />}
        </NavLink>

        <NavLink to="/cart" aria-label="Корзина" className={({ isActive }) => (isActive ? glassActive : glassIdle)}>
          {({ isActive }) => (
            <>
              <ShoppingCart size={26} strokeWidth={isActive ? 2.3 : 1.9} />
              {count > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-sm">
                  {count}
                </span>
              ) : null}
            </>
          )}
        </NavLink>

        <button type="button" onClick={onSearch} aria-label="Поиск" className={glassIdle}>
          <Search size={26} strokeWidth={1.9} />
        </button>
      </div>
    </nav>
  );
}
