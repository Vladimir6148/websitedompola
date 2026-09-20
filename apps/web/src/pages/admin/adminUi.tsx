import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export const adminInputClass =
  'w-full rounded-md border border-graphite/15 bg-white px-3 py-2.5 text-sm text-graphite outline-none transition placeholder:text-graphite/40 focus:border-brand';

export const adminSelectClass = adminInputClass;

export const adminTextareaClass =
  'w-full rounded-md border border-graphite/15 bg-white px-3 py-2.5 text-sm text-graphite outline-none transition placeholder:text-graphite/40 focus:border-brand';

export const adminPanelClass =
  'rounded-2xl border border-graphite/8 bg-white p-4 sm:p-5';

export const adminLabelClass =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50';

type HeaderAction = {
  to?: string;
  onClick?: () => void;
  label: string;
  icon?: ReactNode;
};

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: HeaderAction;
};

export function AdminPageHeader({ eyebrow, title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="mb-5 md:mb-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 max-w-2xl flex-1">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[#ea580c] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
            <Flame size={13} strokeWidth={2.5} className="shrink-0" />
            {eyebrow}
          </span>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-graphite sm:text-3xl md:text-[2.1rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-graphite/55 sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          action.to ? (
            <Link to={action.to} className="btn-primary self-start sm:self-auto">
              {action.icon}
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className="btn-primary self-start sm:self-auto">
              {action.icon}
              {action.label}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

export function StatusBadge({ active, onLabel = 'Активен', offLabel = 'Скрыт' }: { active: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
        active ? 'bg-brand/10 text-brand-dark' : 'bg-graphite/8 text-graphite/55'
      }`}
    >
      {active ? onLabel : offLabel}
    </span>
  );
}

export function AdminSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-lg font-bold text-graphite sm:text-xl">{children}</h2>;
}
