import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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
    <div className="mb-8 md:mb-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
          <h2
            className={`font-display text-2xl font-bold sm:text-3xl md:text-4xl ${
              isDark ? 'text-white' : 'text-graphite'
            }`}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={`mt-2 font-display text-sm leading-relaxed sm:text-base md:text-lg ${
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
    </div>
  );
}
