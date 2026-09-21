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

export function useGoBack(fallback = '/catalog') {
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

/** Inline back control for product page (header also has a global back). */
export function BackButton({ fallback = '/catalog', label = 'Назад' }: Props) {
  const goBack = useGoBack(fallback);

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-graphite/20 bg-white px-3 py-2 text-sm font-semibold text-graphite transition hover:border-brand hover:text-brand"
    >
      <ArrowLeft size={18} strokeWidth={1.75} className="shrink-0 text-graphite/55" />
      <span>{label}</span>
    </button>
  );
}
