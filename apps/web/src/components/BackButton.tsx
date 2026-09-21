import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export type ReturnNavState = {
  from?: string;
};

type Props = {
  fallback?: string;
  label?: string;
  className?: string;
};

export function BackButton({ fallback = '/catalog', label = 'Назад', className = '' }: Props) {
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
      className={`inline-flex items-center gap-2 rounded-full border border-graphite/15 bg-white/95 px-3.5 py-2 text-sm font-semibold text-graphite shadow-[0_4px_14px_rgba(15,92,40,0.08)] backdrop-blur transition hover:border-brand hover:text-brand active:scale-[0.98] ${className}`}
    >
      <ArrowLeft size={16} strokeWidth={2} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}
