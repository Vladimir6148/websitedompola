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
    return (
      <section className="relative min-h-[78vh] overflow-hidden bg-graphite text-white">
        <SmartImage
          src="images/hero.jpg"
          fallback="images/hero.jpg"
          alt="ДОМПОЛА"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-brand-deep/35" />
        <div className="container-dp relative flex min-h-[78vh] flex-col justify-end pb-16 pt-28 md:justify-center md:pb-24">
          <p className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand">ДОМПОЛА</p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl">
            ДомПола — сеть магазинов напольных покрытий
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Акции и актуальные скидки появятся здесь после публикации в админке.
          </p>
          <div className="mt-8">
            <Link to="/promotions" className="btn-primary">
              Узнать подробнее
            </Link>
          </div>
        </div>
      </section>
    );
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
      className="relative min-h-[78vh] overflow-hidden bg-graphite text-white"
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

      <div className="container-dp relative flex min-h-[78vh] flex-col justify-end pb-20 pt-28 md:justify-center md:pb-24">
        <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand">Акции</p>
        {current.discountPercent ? (
          <span className="mb-3 inline-flex w-fit rounded-md bg-brand px-3 py-1 text-sm font-bold text-white">
            −{current.discountPercent}%
          </span>
        ) : null}
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl">
          {current.title}
        </h1>
        {current.description ? (
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">{current.description}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={detailLink} className="btn-primary">
            Узнать подробнее
          </Link>
          <Link
            to="/catalog"
            className="btn-secondary border-white/20 bg-white/10 text-white hover:border-white hover:text-white"
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
            className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 md:left-6"
            aria-label="Предыдущий слайд"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 md:right-6"
            aria-label="Следующий слайд"
          >
            <ChevronRight />
          </button>
          <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
            {items.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Слайд ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-brand' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
