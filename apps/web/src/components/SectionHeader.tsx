import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { to: string; label: string };
  tone?: 'light' | 'dark';
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  tone = 'light',
}: Props) {
  const isDark = tone === 'dark';

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 max-w-2xl flex-1">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[#ea580c] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
            <Flame size={13} strokeWidth={2.5} className="shrink-0" />
            {eyebrow}
          </span>
          <h2
            className={`font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-[2.1rem] ${
              isDark ? 'text-white' : 'text-graphite'
            }`}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={`mt-1.5 max-w-xl text-sm leading-relaxed sm:text-[15px] ${
                isDark ? 'text-white/55' : 'text-graphite/55'
              }`}
            >
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          <Link
            to={action.to}
            className={`group inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border px-3.5 py-2 text-sm font-medium transition sm:self-auto ${
              isDark
                ? 'border-white/15 bg-white/8 text-white/85 hover:border-white/30 hover:bg-white/15'
                : 'border-graphite/12 bg-graphite/[0.04] text-graphite/75 hover:border-graphite/25 hover:bg-graphite hover:text-white'
            }`}
          >
            {action.label}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
