import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gem, Percent, ShieldCheck, Truck } from 'lucide-react';
import { SmartImage } from './SmartImage';

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  thumb?: string;
  ctaLabel: string;
  ctaTo: string;
};

const FEATURES = [
  { icon: Gem, label: 'Широкий выбор дизайнов' },
  { icon: ShieldCheck, label: 'Гарантия качества' },
  { icon: Truck, label: 'Доставка по региону' },
  { icon: Percent, label: 'Выгодные цены' },
];

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'laminate',
    eyebrow: 'НАПОЛЬНЫЕ ПОКРЫТИЯ',
    title: 'Ламинат',
    description: 'Надёжное и стильное решение для любого интерьера',
    image: 'images/hero/hero-laminate.webp',
    thumb: 'images/alpine/lf100-01.webp',
    ctaLabel: 'Подобрать ламинат по параметрам',
    ctaTo: '/catalog/laminate',
  },
  {
    id: 'spc',
    eyebrow: 'НАПОЛЬНЫЕ ПОКРЫТИЯ',
    title: 'Кварцвинил / SPC',
    description: 'Влагостойкие покрытия для кухни, прихожей и тёплого пола',
    image: 'images/hero/hero-spc.webp',
    thumb: 'images/alta/spc1901.webp',
    ctaLabel: 'Подобрать SPC по параметрам',
    ctaTo: '/catalog/quartzvinyl-spc',
  },
  {
    id: 'porcelain',
    eyebrow: 'НАПОЛЬНЫЕ ПОКРЫТИЯ',
    title: 'Керамогранит',
    description: 'Прочный и выразительный пол для дома и коммерции',
    image: 'images/hero/hero-porcelain.webp',
    thumb: 'images/floor3.webp',
    ctaLabel: 'Смотреть керамогранит',
    ctaTo: '/catalog/porcelain',
  },
];

type Props = {
  slides?: HeroSlide[];
};

export function PromoCarousel({ slides = DEFAULT_HERO_SLIDES }: Props) {
  const items = slides.filter((s) => s.image);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  if (!items.length) return null;

  const current = items[index];

  function go(delta: number) {
    setIndex((i) => (i + delta + items.length) % items.length);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest('a, button')) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: ReactPointerEvent<HTMLElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || items.length <= 1) return;
    if ((e.target as HTMLElement).closest('a, button')) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    }
  }

  function onWheel(e: React.WheelEvent<HTMLElement>) {
    if (items.length <= 1 || wheelLock.current) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 18) return;
    e.preventDefault();
    wheelLock.current = true;
    go(delta > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 450);
  }

  return (
    <section
      className="select-none bg-white md:pb-3 md:pt-3"
      aria-roledescription="carousel"
      aria-label="Напольные покрытия"
    >
      <div className="w-full md:px-5 lg:px-6">
        <div
          className="relative touch-pan-y overflow-hidden bg-graphite text-white md:rounded-2xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointerStart.current = null;
          }}
          onWheel={onWheel}
        >
          <div className="relative min-h-[52vh] w-full md:min-h-[400px] lg:min-h-[460px]">
            {items.map((slide, i) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={i !== index}
              >
                <SmartImage
                  src={slide.image}
                  fallback="images/wood.webp"
                  alt={slide.title}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent md:via-ink/35" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-ink/25" />

            <div className="relative flex min-h-[52vh] flex-col justify-between px-4 pb-12 pt-10 sm:px-6 md:min-h-[400px] md:px-8 md:pb-9 md:pt-10 lg:min-h-[460px] lg:px-10">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 sm:text-xs">
                  {current.eyebrow}
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                  {current.title}
                </h1>
                <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base md:text-lg">
                  {current.description}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-4 md:mt-8 md:gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                <div className="hidden grid-cols-2 gap-3 sm:grid md:flex md:flex-wrap md:gap-5">
                  {FEATURES.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-start gap-2.5 sm:max-w-[11rem]">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10">
                        <Icon size={15} strokeWidth={1.75} />
                      </span>
                      <span className="text-[11px] font-medium leading-snug text-white/90 sm:text-xs">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                  {FEATURES.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10">
                        <Icon size={13} strokeWidth={1.75} />
                      </span>
                      <span className="text-[10px] font-medium leading-snug text-white/90">{label}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to={current.ctaTo}
                  className="group flex w-full max-w-md items-center gap-2.5 rounded-2xl bg-white/95 p-2 pr-2.5 text-graphite shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur transition hover:bg-white sm:gap-3 sm:p-2.5 sm:pr-3"
                >
                  {current.thumb ? (
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-mist sm:h-14 sm:w-14">
                      <SmartImage
                        src={current.thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug sm:text-[15px]">
                    {current.ctaLabel}
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white transition group-hover:bg-brand-dark">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              </div>
            </div>

            {items.length > 1 ? (
              <div className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5 md:bottom-4">
                {items.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Слайд ${i + 1}: ${slide.title}`}
                    onClick={() => setIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? 'w-7 bg-white' : 'w-2 bg-white/45 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
