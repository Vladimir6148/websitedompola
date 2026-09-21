import { Link } from 'react-router-dom';

type BrandMarkProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
};

const sizeClass = {
  sm: 'px-2.5 py-1 text-[13px] tracking-[0.06em]',
  md: 'px-3 py-1.5 text-[15px] tracking-[0.07em] sm:px-3.5 sm:text-base',
  lg: 'px-4 py-2 text-lg tracking-[0.08em]',
} as const;

/** Фирменный знак сети магазинов ДОМПОЛА */
export function BrandMark({ to = '/', size = 'md', className = '', onClick }: BrandMarkProps) {
  const mark = (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-brand font-display font-bold uppercase leading-none text-white shadow-[0_6px_16px_rgba(31,138,61,0.28)] ring-1 ring-brand-dark/15 transition hover:bg-brand-dark ${sizeClass[size]} ${className}`}
    >
      ДОМПОЛА
    </span>
  );

  if (!to) {
    return (
      <span className="inline-flex" onClick={onClick}>
        {mark}
      </span>
    );
  }

  return (
    <Link to={to} onClick={onClick} aria-label="ДОМПОЛА — на главную" className="inline-flex shrink-0">
      {mark}
    </Link>
  );
}
