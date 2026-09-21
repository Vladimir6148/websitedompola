import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export type ReturnNavState = {
  from?: string;
};

type Props = {
  fallback?: string;
  label?: string;
};

/** Fixed floating back control — always visible on product pages. */
export function BackButton({ fallback = '/catalog', label = 'Назад' }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as ReturnNavState | null)?.from;

  function goBack() {
    if (from) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  }

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
