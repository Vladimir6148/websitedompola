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

/** Floating back — outline icon style matching mobile bottom nav. */
export function BackButton({ fallback = '/catalog', label = 'Назад' }: Props) {
  const goBack = useGoBack(fallback);

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className="fixed bottom-[4.75rem] left-3 z-[70] flex flex-col items-center gap-0.5 md:bottom-6 md:left-6"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-graphite/50 shadow-[0_8px_24px_rgba(15,40,20,0.12)] ring-1 ring-graphite/10 transition hover:bg-brand/10 hover:text-brand active:scale-95 md:h-11 md:w-11">
        <ArrowLeft size={22} strokeWidth={1.75} />
      </span>
      <span className="text-[11px] font-semibold tracking-wide text-graphite/50">{label}</span>
    </button>
  );
}
