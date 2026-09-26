import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, PenTool, Wrench } from 'lucide-react';
import { BrandMark } from './BrandMark';

const SOCIAL: { name: string; href: string; icon: ReactNode }[] = [
  {
    name: 'ВКонтакте',
    href: 'https://vk.com/dompola29',
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
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
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
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
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 3.2v6.3h6.05A7.01 7.01 0 0 0 13 5.2zM5.2 12A6.8 6.8 0 0 1 12 5.2V12H5.2zm1.75 5.55A6.8 6.8 0 0 1 5.2 13H12v5.75a6.81 6.81 0 0 1-5.05-1.2zM13 18.8V13h5.8A6.8 6.8 0 0 1 13 18.8z"
        />
      </svg>
    ),
  },
];

const PAYMENTS = [
  { name: 'Мир', label: 'МИР' },
  { name: 'СБП', label: 'СБП' },
  { name: 'Visa', label: 'VISA' },
] as const;

const CATALOG = [
  { to: '/catalog/quartzvinyl-spc', label: 'Кварцвинил / SPC' },
  { to: '/catalog/laminate', label: 'Ламинат' },
  { to: '/catalog/linoleum', label: 'Линолеум' },
  { to: '/catalog/porcelain', label: 'Керамогранит' },
] as const;

const NAV = [
  { to: '/services', label: 'Услуги' },
  { to: '/stores', label: 'Магазины' },
  { to: '/contacts', label: 'Контакты' },
] as const;

const PARTNERS = [
  {
    to: '/contacts?for=legal',
    title: 'Юрлицам',
    subtitle: 'Счета, договоры, отсрочка',
    icon: Building2,
  },
  {
    to: '/contacts?for=designers',
    title: 'Дизайнерам',
    subtitle: 'Образцы и спецусловия',
    icon: PenTool,
  },
  {
    to: '/contacts?for=masters',
    title: 'Мастерам',
    subtitle: 'Опт и быстрый подбор',
    icon: Wrench,
  },
] as const;

function SocialButton({ name, href, icon }: { name: string; href: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      title={name}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand hover:text-white"
    >
      {icon}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto bg-graphite text-white">
      <div className="container-dp py-6 md:py-7">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] lg:items-start lg:gap-8">
          <div className="min-w-0">
            <BrandMark size="sm" />
            <p className="mt-2 max-w-[16rem] text-[13px] leading-snug text-white/55">
              Сеть магазинов напольных покрытий
            </p>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Каталог
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-white/75">
              {CATALOG.map((item) => (
                <Link key={item.to} to={item.to} className="transition hover:text-brand">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Компания и связь
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/75">
              {NAV.map((item) => (
                <Link key={item.to} to={item.to} className="transition hover:text-brand">
                  {item.label}
                </Link>
              ))}
              <span className="hidden text-white/20 sm:inline" aria-hidden>
                ·
              </span>
              <a
                href="https://vk.com/dompola29"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand transition hover:text-white"
              >
                ВК ДомПола
              </a>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[13px]">
              <a href="mailto:dompola29@mail.ru" className="text-white/75 transition hover:text-brand">
                dompola29@mail.ru
              </a>
              <span className="text-white/40">Пн–Сб 10:00–20:00</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {PARTNERS.map(({ to, title, subtitle, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 transition hover:border-brand/50 hover:bg-brand/15"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-[0_0_0_1px_rgba(31,138,61,0.35)]">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-white">{title}</span>
                <span className="mt-0.5 block truncate text-[11px] leading-tight text-white/45">
                  {subtitle}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-dp flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              {SOCIAL.map((s) => (
                <SocialButton key={s.name} {...s} />
              ))}
            </div>
            <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
            <div className="flex flex-wrap items-center gap-1.5">
              {PAYMENTS.map((p) => (
                <span
                  key={p.name}
                  title={p.name}
                  className="inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded bg-white/10 px-1.5 text-[10px] font-bold tracking-wide text-white/80"
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/40">
            <span>© {new Date().getFullYear()} ДОМПОЛА</span>
            <Link to="/admin" className="transition hover:text-white/70">
              Вход для сотрудников
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
