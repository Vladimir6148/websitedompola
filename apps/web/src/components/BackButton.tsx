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
    // Return to the exact catalog URL (filters/page) and restore scroll there
    if (from) {
      const { pathname, search } = parsePath(from);
      const y = readScroll(pathname, search) ?? 0;
      setPendingRestore(from, y);
      navigate(from, { replace: true });
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };
}

/** Floating glass «Назад» on all pages except home. */
export function BackButton({ fallback = '/', label = 'Назад' }: Props) {
  const goBack = useGoBack(fallback);
  const location = useLocation();

  if (location.pathname === '/') return null;

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className="fixed bottom-[4.75rem] left-4 z-[70] inline-flex items-center gap-2 rounded-full border border-white/70 bg-gradient-to-b from-white/85 via-white/55 to-white/35 px-4 py-3 text-sm font-semibold text-graphite shadow-[0_10px_28px_rgba(15,40,20,0.18),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/40 backdrop-blur-xl backdrop-saturate-150 transition hover:border-brand/40 hover:text-brand active:scale-[0.97] md:bottom-6 md:left-6 md:px-5 md:py-3.5 md:text-base"
    >
      <ArrowLeft size={18} strokeWidth={2.25} className="shrink-0 text-brand" />
      <span>{label}</span>
    </button>
  );
}
