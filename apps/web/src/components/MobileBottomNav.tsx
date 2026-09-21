import { NavLink } from 'react-router-dom';
import { ArrowLeft, Home, LayoutGrid, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../store/cart';
import { useGoBack } from './BackButton';

type Props = {
  onSearch: () => void;
};

const glassBase =
  'relative grid aspect-square w-full max-w-[4.25rem] place-items-center overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-white/85 via-white/55 to-white/35 shadow-[0_10px_28px_rgba(15,40,20,0.18),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/40 backdrop-blur-xl backdrop-saturate-150 transition active:scale-95 before:pointer-events-none before:absolute before:inset-x-1 before:top-1 before:h-2 before:rounded-full before:bg-gradient-to-b before:from-white/70 before:to-transparent';

const glassIdle = `${glassBase} text-graphite hover:border-brand/40 hover:from-white/90 hover:via-white/65 hover:to-white/45 hover:text-brand`;
const glassActive = `${glassBase} border-brand/40 from-white/90 via-white/70 to-white/50 text-brand ring-brand/20`;

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
