import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { SmartImage } from './SmartImage';
import type { Promotion } from '../types';

type Props = {
  slides: Promotion[];
};

export function PromoCarousel({ slides }: Props) {
  const items = slides.filter((s) => s.active !== false && s.image);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  if (!items.length) {
    return null;
  }

  const current = items[index];
  const detailLink = (current as Promotion & { ctaLink?: string }).ctaLink || '/promotions';

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

    // Swipe left/right
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
      return;
    }

    // Tap: left half = prev, right half = next
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      go(e.clientX < mid ? -1 : 1);
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
      className="bg-white select-none md:pb-2 md:pt-4"
      aria-roledescription="carousel"
      aria-label="Акции и скидки"
    >
      <div className="mx-auto w-full max-w-[1440px] md:px-6 lg:px-10">
        <div
          className="relative min-h-[52vh] touch-pan-y overflow-hidden bg-graphite text-white md:min-h-[420px] md:rounded-2xl lg:min-h-[480px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointerStart.current = null;
          }}
          onWheel={onWheel}
        >
          {items.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              aria-hidden={i !== index}
            >
              <SmartImage
                src={slide.image}
                fallback="images/promo.jpg"
                alt={slide.title}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-brand-deep/30" />

          <div className="relative flex min-h-[52vh] flex-col justify-end px-4 pb-14 pt-16 sm:px-6 md:min-h-[420px] md:justify-center md:px-10 md:pb-16 md:pt-16 lg:min-h-[480px] lg:px-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">Акции</p>
            {current.discountPercent ? (
              <span className="mb-2 inline-flex w-fit rounded-md bg-brand px-2.5 py-0.5 text-xs font-bold text-white">
                −{current.discountPercent}%
              </span>
            ) : null}
            <h1 className="max-w-2xl text-3xl font-bold leading-[1.15] sm:text-4xl lg:text-5xl">
              {current.title}
            </h1>
            {current.description ? (
              <p className="mt-3 max-w-lg text-sm text-white/80 sm:text-base">{current.description}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to={detailLink} className="btn-primary px-4 py-2.5 text-sm">
                Узнать подробнее
              </Link>
              <Link
                to="/catalog"
                className="btn-secondary border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white hover:border-white hover:text-white"
              >
                Смотреть каталог
              </Link>
            </div>
          </div>

          {items.length > 1 ? (
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 md:bottom-5">
              {items.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Слайд ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand' : 'w-2 bg-white/45 hover:bg-white/70'}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
