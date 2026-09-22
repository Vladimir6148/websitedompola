import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Phone, Search, ShoppingCart, X } from 'lucide-react';
import { useCart } from '../store/cart';
import { BrandMark } from './BrandMark';
import { MobileBottomNav } from './MobileBottomNav';
import { SideNav } from './SideNav';

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

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
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
        <div className="container-dp flex h-[4.25rem] min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-graphite/20 bg-white text-graphite transition hover:border-brand hover:text-brand sm:h-11 sm:w-11 lg:hidden"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>

          <BrandMark size="md" />

          <form onSubmit={onSearch} className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg">
            <label className="flex h-10 items-center gap-2 rounded-full border border-graphite/20 bg-mist/80 px-3.5 transition focus-within:border-brand focus-within:bg-white sm:h-11">
              <Search size={16} strokeWidth={1.75} className="shrink-0 text-graphite/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск покрытий"
                aria-label="Поиск напольных покрытий"
                className="min-w-0 w-full bg-transparent text-sm text-graphite outline-none placeholder:text-graphite/40"
              />
            </label>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href="tel:+79214994979"
              aria-label="Позвонить"
              className="grid h-10 w-10 place-items-center rounded-full border border-graphite/20 bg-white text-graphite transition hover:border-brand hover:text-brand sm:h-11 sm:w-11"
            >
              <Phone size={18} strokeWidth={1.75} />
            </a>
            <Link
              to="/cart"
              aria-label="Корзина"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-graphite/20 bg-white text-graphite transition hover:border-brand hover:text-brand sm:h-11 sm:w-11"
            >
              <ShoppingCart size={18} strokeWidth={1.75} />
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[9999] lg:hidden" role="dialog" aria-modal="true" aria-label="Меню">
              <button type="button" className="absolute inset-0 bg-ink/55" aria-label="Закрыть" onClick={close} />
              <div className="absolute inset-y-0 left-0 flex h-full w-[min(92vw,20rem)] flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-graphite/8 px-3 py-3">
                  <BrandMark size="md" onClick={close} />
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Закрыть меню"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-mist text-graphite"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="shrink-0 border-b border-graphite/8 px-3 py-3">
                  <form onSubmit={onSearch}>
                    <div className="flex items-center gap-2 rounded-xl border border-graphite/15 px-3 py-2.5">
                      <Search size={16} className="shrink-0 text-graphite/35" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Поиск покрытий"
                        className="w-full bg-transparent text-[15px] outline-none placeholder:text-graphite/40"
                      />
                    </div>
                  </form>
                </div>
                <SideNav onNavigate={close} className="min-h-0 flex-1" />
              </div>
            </div>,
            document.body,
          )
        : null}

      <MobileBottomNav onSearch={() => setOpen(true)} />
    </>
  );
}
