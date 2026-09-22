import { Link } from 'react-router-dom';

type BrandMarkProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
};

/** Heights match / exceed header icon buttons (h-10). */
const sizeClass = {
  sm: 'h-10 px-3.5 text-[15px] tracking-[0.08em]',
  md: 'h-10 px-4 text-base tracking-[0.09em] sm:h-11 sm:px-5 sm:text-lg',
  lg: 'h-12 px-5 text-xl tracking-[0.1em] sm:h-14 sm:px-6 sm:text-2xl',
} as const;

/** Фирменный знак сети магазинов ДОМПОЛА */
export function BrandMark({ to = '/', size = 'md', className = '', onClick }: BrandMarkProps) {
  const mark = (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-brand font-display font-bold uppercase leading-none text-white transition hover:bg-brand-dark ${sizeClass[size]} ${className}`}
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
