import { NavLink } from 'react-router-dom';
import { ArrowLeft, Home, LayoutGrid, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../store/cart';
import { useGoBack } from './BackButton';

type Props = {
  onSearch: () => void;
};

const glassBase =
  'relative grid aspect-square w-full max-w-[4.5rem] place-items-center overflow-hidden rounded-[1.15rem] border transition duration-200 active:scale-[0.94]';

const glassIdle = [
  glassBase,
  'border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.55)_45%,rgba(240,248,242,0.42)_100%)]',
  'text-graphite shadow-[0_8px_20px_rgba(15,40,20,0.22),0_2px_6px_rgba(15,40,20,0.12),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_1px_rgba(15,40,20,0.06)]',
  'ring-1 ring-black/5 backdrop-blur-2xl backdrop-saturate-150',
  'hover:border-brand/35 hover:text-brand hover:shadow-[0_12px_28px_rgba(31,138,61,0.22),0_2px_8px_rgba(15,40,20,0.12),inset_0_1px_0_rgba(255,255,255,1)]',
].join(' ');

const glassActive = [
  glassBase,
  'border-brand/50 bg-[linear-gradient(160deg,rgba(255,255,255,0.95)_0%,rgba(220,242,226,0.75)_50%,rgba(31,138,61,0.18)_100%)]',
  'text-brand shadow-[0_12px_30px_rgba(31,138,61,0.32),0_2px_8px_rgba(15,40,20,0.14),inset_0_1px_0_rgba(255,255,255,1),inset_0_0_0_1px_rgba(31,138,61,0.12)]',
  'ring-1 ring-brand/25 backdrop-blur-2xl backdrop-saturate-150',
].join(' ');

const shine =
  'pointer-events-none absolute inset-x-[18%] top-[10%] h-[28%] rounded-full bg-gradient-to-b from-white/90 to-transparent opacity-90';

export function MobileBottomNav({ onSearch }: Props) {
  const { count } = useCart();
  const goBack = useGoBack('/');

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] md:hidden"
      aria-label="Нижнее меню"
    >
      <div className="pointer-events-auto mx-auto flex w-full items-end justify-between gap-2.5 px-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 sm:gap-3 sm:px-4">
        <button type="button" onClick={goBack} aria-label="Назад" className={glassIdle}>
          <span className={shine} aria-hidden />
          <ArrowLeft size={27} strokeWidth={2.2} className="relative text-brand drop-shadow-sm" />
        </button>

        <NavLink to="/" end aria-label="Главная" className={({ isActive }) => (isActive ? glassActive : glassIdle)}>
          {({ isActive }) => (
            <>
              <span className={shine} aria-hidden />
              <Home size={27} strokeWidth={isActive ? 2.35 : 2} className="relative drop-shadow-sm" />
            </>
          )}
        </NavLink>

        <NavLink
          to="/catalog"
          aria-label="Каталог"
          className={({ isActive }) => (isActive ? glassActive : glassIdle)}
        >
          {({ isActive }) => (
            <>
              <span className={shine} aria-hidden />
              <LayoutGrid size={27} strokeWidth={isActive ? 2.35 : 2} className="relative drop-shadow-sm" />
            </>
          )}
        </NavLink>

        <NavLink to="/cart" aria-label="Корзина" className={({ isActive }) => (isActive ? glassActive : glassIdle)}>
          {({ isActive }) => (
            <>
              <span className={shine} aria-hidden />
              <ShoppingCart size={27} strokeWidth={isActive ? 2.35 : 2} className="relative drop-shadow-sm" />
              {count > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(31,138,61,0.45)] ring-2 ring-white">
                  {count}
                </span>
              ) : null}
            </>
          )}
        </NavLink>

        <button type="button" onClick={onSearch} aria-label="Поиск" className={glassIdle}>
          <span className={shine} aria-hidden />
          <Search size={27} strokeWidth={2} className="relative drop-shadow-sm" />
        </button>
      </div>
    </nav>
  );
}
