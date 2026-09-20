import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

type Chip = { to: string; label: string };

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { to: string; label: string };
  chips?: Chip[];
  tone?: 'light' | 'dark';
  children?: ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  chips,
  tone = 'light',
}: Props) {
  const isDark = tone === 'dark';

  return (
    <div className="mb-8 md:mb-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p
            className={`mb-2 text-xs font-semibold uppercase tracking-[0.18em] ${
              isDark ? 'text-brand' : 'text-brand'
            }`}
          >
            {eyebrow}
          </p>
          <h2
            className={`font-display text-3xl font-bold md:text-4xl ${
              isDark ? 'text-white' : 'text-graphite'
            }`}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={`mt-2 text-sm leading-relaxed md:text-base ${
                isDark ? 'text-white/65' : 'text-graphite/60'
              }`}
            >
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <Link
            to={action.to}
            className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold transition md:self-auto ${
              isDark
                ? 'border-white/20 bg-white/10 text-white hover:border-brand hover:bg-brand'
                : 'border-brand/25 bg-white text-brand hover:border-brand hover:bg-brand hover:text-white'
            }`}
          >
            {action.label}
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
      {chips?.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.to}
              to={chip.to}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                isDark
                  ? 'bg-white/10 text-white/80 ring-1 ring-white/15 hover:bg-brand hover:text-white'
                  : 'bg-white text-graphite/75 shadow-sm ring-1 ring-graphite/8 hover:text-brand hover:ring-brand/30'
              }`}
            >
              {chip.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
