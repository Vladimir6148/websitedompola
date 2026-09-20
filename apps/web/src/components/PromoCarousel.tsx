import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SmartImage } from './SmartImage';
import type { Promotion } from '../types';

type Props = {
  slides: Promotion[];
};

export function PromoCarousel({ slides }: Props) {
  const items = slides.filter((s) => s.active !== false && s.image);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

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

  function prev() {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }
  function next() {
    setIndex((i) => (i + 1) % items.length);
  }

  return (
    <section
      className="relative min-h-[52vh] overflow-hidden bg-graphite text-white md:min-h-[55vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Акции и скидки"
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
            className="absolute inset-0 h-full w-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-brand-deep/30" />

      <div className="container-dp relative flex min-h-[52vh] flex-col justify-end pb-12 pt-16 md:min-h-[55vh] md:justify-center md:pb-14 md:pt-20">
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand">Акции</p>
        {current.discountPercent ? (
          <span className="mb-2 inline-flex w-fit rounded-md bg-brand px-2.5 py-0.5 text-xs font-bold text-white">
            −{current.discountPercent}%
          </span>
        ) : null}
        <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.15] sm:text-4xl lg:text-5xl">
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
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 md:left-5"
            aria-label="Предыдущий слайд"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 md:right-5"
            aria-label="Следующий слайд"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5">
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
        </>
      ) : null}
    </section>
  );
}
