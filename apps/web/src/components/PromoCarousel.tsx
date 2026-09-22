import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Percent, ShieldCheck, Truck } from 'lucide-react';
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
    thumb: 'images/pergo/741.webp',
    ctaLabel: 'Скидка 20 % на Pergo Skara 12 pro',
    ctaTo: '/catalog/laminate?brand=skara',
  },
  {
    id: 'spc',
    eyebrow: 'НАПОЛЬНЫЕ ПОКРЫТИЯ',
    title: 'Кварцвинил / SPC',
    description: 'Влагостойкие покрытия для кухни, прихожей и тёплого пола',
    image: 'images/hero/hero-spc.webp',
    thumb: 'images/alta/mramor-seryj.webp',
    ctaLabel: 'Скидка 15 % на Alta Step Arriba',
    ctaTo: '/catalog/quartzvinyl-spc?brand=alta-step',
  },
  {
    id: 'porcelain',
    eyebrow: 'НАПОЛЬНЫЕ ПОКРЫТИЯ',
    title: 'Керамогранит',
    description: 'Прочный и выразительный пол для дома и коммерции',
    image: 'images/hero/hero-porcelain.webp',
    thumb: 'images/remote/oad-iblock-1b4-uvhzgkljrq51hpqlvxev819hbfi4ibbn-melton-brown-_-bs-445x445.webp',
    ctaLabel: 'Скидка 10 % на Primavera',
    ctaTo: '/catalog/porcelain?brand=primavera',
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

  function goTo(i: number) {
    setIndex(((i % items.length) + items.length) % items.length);
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
      return;
    }

    // Click / tap on left or right edge → change slide
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / Math.max(rect.width, 1);
      if (ratio < 0.22) go(-1);
      else if (ratio > 0.78) go(1);
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
          className="relative cursor-pointer touch-pan-y overflow-hidden bg-graphite text-white md:rounded-2xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointerStart.current = null;
          }}
          onWheel={onWheel}
        >
          <div className="relative min-h-[58vh] w-full md:min-h-[440px] lg:min-h-[520px]">
            {items.map((slide, i) => {
              const active = i === index;
              const preloadNext = i === (index + 1) % items.length;
              const shouldLoad = active || preloadNext;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    active ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                  aria-hidden={!active}
                >
                  {shouldLoad ? (
                    <SmartImage
                      src={slide.image}
                      fallback="images/wood.webp"
                      alt={slide.title}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                      loading={active ? 'eager' : 'lazy'}
                      priority={active}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-ink/40" aria-hidden />
                  )}
                </div>
              );
            })}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent md:via-ink/35" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-ink/25" />

            <div className="relative flex min-h-[58vh] flex-col justify-between px-4 pb-14 pt-10 sm:px-6 md:min-h-[440px] md:px-8 md:pb-11 md:pt-12 lg:min-h-[520px] lg:px-10">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-sm">
                  {current.eyebrow}
                </p>
                <h1 className="mt-3 font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  {current.title}
                </h1>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg md:text-xl">
                  {current.description}
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 md:mt-10 lg:mt-auto lg:flex-row lg:items-stretch lg:gap-4 xl:gap-5">
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:gap-4 xl:gap-5">
                  {FEATURES.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex h-full min-h-[5rem] items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-sm sm:min-h-[5.25rem] lg:min-h-[5.5rem] lg:gap-4 lg:px-5"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/30 bg-white/15 sm:h-12 sm:w-12">
                        <Icon size={20} strokeWidth={1.85} className="text-[#d5ddd6]" />
                      </span>
                      <span className="min-w-0 flex-1 text-[14px] font-semibold leading-tight text-white sm:text-[15px] xl:text-base">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to={current.ctaTo}
                  className="pointer-events-auto group flex w-full shrink-0 items-center gap-3 rounded-2xl bg-white p-3 text-graphite shadow-[0_16px_48px_rgba(0,0,0,0.28)] transition hover:bg-white sm:gap-3.5 sm:p-3.5 lg:w-[min(100%,22rem)] lg:min-h-[5.5rem] lg:max-w-none lg:py-0 xl:w-[24rem]"
                >
                  {current.thumb ? (
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mist sm:h-16 sm:w-16 lg:h-14 lg:w-14">
                      <SmartImage
                        src={current.thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 text-[15px] font-bold leading-snug sm:text-base lg:text-[15px] xl:text-base">
                    {current.ctaLabel}
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_8px_20px_rgba(31,138,61,0.35)] transition group-hover:bg-brand-dark sm:h-12 sm:w-12">
                    <ArrowRight size={20} strokeWidth={2.25} />
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
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => goTo(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75'
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
