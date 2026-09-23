import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';

const SOCIAL: { name: string; href: string; icon: ReactNode }[] = [
  {
    name: 'ВКонтакте',
    href: 'https://vk.com/dompola29',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" aria-hidden>
        <path
          fill="currentColor"
          d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.45-1.7-1.45-.86-.83-1.24-.94-1.45-.94-.3 0-.38.08-.38.5v1.32c0 .36-.12.58-1.07.58-1.58 0-3.33-.96-4.56-2.74-1.85-2.6-2.36-4.56-2.36-4.96 0-.21.08-.4.5-.4h1.46c.37 0 .51.17.65.57.72 2.08 1.92 3.9 2.42 3.9.18 0 .27-.09.27-.55V9.4c-.06-.98-.57-1.06-.57-1.41 0-.17.14-.34.37-.34h2.3c.31 0 .42.17.42.53v2.86c0 .31.14.42.23.42.18 0 .33-.11.66-.44 1.02-1.14 1.75-2.9 1.75-2.9.1-.21.26-.4.63-.4h1.46c.44 0 .53.23.44.53-.18.86-1.93 3.32-1.93 3.32-.16.25-.21.37 0 .65.16.21.68.66 1.03 1.06.64.73 1.13 1.34 1.26 1.76.14.41-.07.62-.48.62z"
        />
      </svg>
    ),
  },
  {
    name: 'Одноклассники',
    href: 'https://ok.ru/group/70000005493025',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" aria-hidden>
        <path
          fill="currentColor"
          d="M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5.1 7.05a.95.95 0 0 1-1.34.05 5.05 5.05 0 0 0-7.52 0 .95.95 0 1 1-1.29-1.4 6.95 6.95 0 0 1 10.1 0c.37.4.35 1.02-.05 1.35zm.55 1.85-1.55.8a4.4 4.4 0 0 1-8.2 0l-1.55-.8a1 1 0 0 0-.9 1.79l1.55.8a6.4 6.4 0 0 0 10 0l1.55-.8a1 1 0 1 0-.9-1.79z"
        />
      </svg>
    ),
  },
  {
    name: 'Дзен',
    href: 'https://dzen.ru/dompola',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 3.2v6.3h6.05A7.01 7.01 0 0 0 13 5.2zM5.2 12A6.8 6.8 0 0 1 12 5.2V12H5.2zm1.75 5.55A6.8 6.8 0 0 1 5.2 13H12v5.75a6.81 6.81 0 0 1-5.05-1.2zM13 18.8V13h5.8A6.8 6.8 0 0 1 13 18.8z"
        />
      </svg>
    ),
  },
];

const PAYMENTS: { name: string; label: string }[] = [
  { name: 'Мир', label: 'МИР' },
  { name: 'СБП', label: 'СБП' },
  { name: 'Visa', label: 'VISA' },
];

function SocialButton({ name, href, icon }: { name: string; href: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      title={name}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-graphite transition hover:bg-brand hover:text-white"
    >
      {icon}
    </a>
  );
}

function PaymentBadge({ name, label }: { name: string; label: string }) {
  return (
    <span
      title={name}
      aria-label={name}
      className="inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-md bg-white/10 px-2.5 text-[11px] font-bold tracking-wide text-white ring-1 ring-white/15"
    >
      {label}
    </span>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto bg-graphite text-white">
      <div className="container-dp grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandMark size="lg" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            Розничная сеть магазинов напольных покрытий
          </p>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Каталог</div>
          <div className="grid gap-2 text-sm text-white/80">
            <Link to="/catalog/quartzvinyl-spc" className="hover:text-brand">
              Кварцвинил / SPC
            </Link>
            <Link to="/catalog/laminate" className="hover:text-brand">
              Ламинат
            </Link>
            <Link to="/catalog/linoleum" className="hover:text-brand">
              Линолеум
            </Link>
            <Link to="/catalog/porcelain" className="hover:text-brand">
              Керамогранит
            </Link>
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Компания</div>
          <div className="grid gap-2 text-sm text-white/80">
            <Link to="/services" className="hover:text-brand">
              Услуги
            </Link>
            <Link to="/stores" className="hover:text-brand">
              Магазины
            </Link>
            <Link to="/contacts" className="hover:text-brand">
              Контакты
            </Link>
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Контакты</div>
          <div className="grid gap-2 text-sm text-white/80">
            <a href="tel:+79214994979" className="hover:text-brand">
              +7 (921) 499-49-79
            </a>
            <a href="mailto:dompola29@mail.ru" className="hover:text-brand">
              dompola29@mail.ru
            </a>
            <p>Пн–Сб 10:00–20:00</p>
          </div>
          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
              Социальные сети
            </div>
            <div className="flex flex-wrap gap-2.5">
              {SOCIAL.map((s) => (
                <SocialButton key={s.name} {...s} />
              ))}
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
              Способы оплаты
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYMENTS.map((p) => (
                <PaymentBadge key={p.name} {...p} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-dp flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} ДОМПОЛА</span>
          <Link to="/admin" className="hover:text-white">
            Вход для сотрудников
          </Link>
        </div>
      </div>
    </footer>
  );
}
