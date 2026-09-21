import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parsePath, readScroll, setPendingRestore } from '../lib/scrollMemory';

export type ReturnNavState = {
  from?: string;
};

type Props = {
  fallback?: string;
  label?: string;
};

export function useGoBack(fallback = '/') {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as ReturnNavState | null)?.from;

  return () => {
    if (from) {
      const { pathname, search } = parsePath(from);
      const y = readScroll(pathname, search) ?? 0;
      setPendingRestore(from, y);
      navigate(-1);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };
}

/** Fixed floating back control — restores previous page scroll position. */
export function BackButton({ fallback = '/', label = 'Назад' }: Props) {
  const goBack = useGoBack(fallback);
  const location = useLocation();

  if (location.pathname === '/') return null;

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className="fixed bottom-[4.75rem] left-4 z-[70] inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,92,40,0.35)] transition hover:bg-brand-dark active:scale-[0.97] md:bottom-6 md:left-6 md:px-5 md:py-3.5 md:text-base"
    >
      <ArrowLeft size={18} strokeWidth={2.25} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}
