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

/** Fixed floating glass back control — restores previous page scroll position. */
export function BackButton({ fallback = '/', label = 'Назад' }: Props) {
  const goBack = useGoBack(fallback);
  const location = useLocation();

  if (location.pathname === '/') return null;

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className="fixed bottom-[5.75rem] left-4 z-[70] inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/45 px-4 py-3 text-sm font-semibold text-graphite shadow-[0_10px_32px_rgba(15,40,20,0.18)] backdrop-blur-md transition hover:border-brand/40 hover:bg-white/70 hover:text-brand active:scale-[0.97] md:bottom-6 md:left-6 md:px-5 md:py-3.5 md:text-base"
    >
      <ArrowLeft size={18} strokeWidth={2.25} className="shrink-0 text-brand" />
      <span>{label}</span>
    </button>
  );
}
