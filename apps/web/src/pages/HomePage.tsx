import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Compass, Hammer, Store as StoreIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { LeadForm } from '../components/LeadForm';
import { api } from '../lib/api';
import type { HomePayload } from '../types';

const icons: Record<string, ReactNode> = {
  store: <StoreIcon />,
  compass: <Compass />,
  hammer: <Hammer />,
  calculator: <Calculator />,
};

export function HomePage() {
  const [data, setData] = useState<HomePayload | null>(null);

  useEffect(() => {
    api<HomePayload>('/api/content/home').then(setData).catch(() => undefined);
  }, []);

  const hero = data?.banners?.[0];

  return (
    <>
      <Seo
        title="ДОМПОЛА — напольные покрытия"
        description="Кварцвинил, ламинат, линолеум, керамогранит и паркет в Архангельске, Северодвинске и Вологде."
        path="/"
        image={hero?.image || undefined}
      />

      <section className="relative min-h-[78vh] overflow-hidden bg-graphite text-white">
        <img
          src={hero?.image || 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1800&q=80'}
          alt="Интерьер с напольным покрытием ДОМПОЛА"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-brand-deep/35" />
        <div className="container-dp relative flex min-h-[78vh] flex-col justify-end pb-16 pt-28 md:justify-center md:pb-24">
          <p className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand">ДОМПОЛА</p>
          <h1 className="max-w-3xl font-display text-4xl font-normal leading-[1.15] sm:text-5xl lg:text-6xl">
            {hero?.title || 'ДомПола — сеть магазинов напольных покрытий'}
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            {hero?.subtitle ||
              'Подберём покрытие под комнату, нагрузку и тёплый пол — без шаблонных решений.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={hero?.ctaLink || '/catalog'} className="btn-primary">
              {hero?.ctaText || 'Смотреть каталог'}
              <ArrowRight size={16} />
            </Link>
            <Link to="/picker" className="btn-secondary border-white/20 bg-white/10 text-white hover:border-white hover:text-white">
              Подобрать покрытие
            </Link>
          </div>
        </div>
      </section>

      <section className="container-dp py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="section-title">Категории</h2>
          <Link to="/catalog" className="hidden text-sm font-semibold text-brand hover:underline sm:inline">
            Весь каталог
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.categories || []).map((c, i) => (
            <Link
              key={c.id}
              to={`/catalog/${c.slug}`}
              className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'sm:col-span-2 sm:row-span-2 min-h-[280px]' : 'min-h-[180px]'}`}
            >
              <img
                src={c.image || ''}
                alt={c.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-xl font-semibold text-white md:text-2xl">{c.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-white/70">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {(data?.promotions?.length || 0) > 0 ? (
        <section className="bg-mist py-16 md:py-20">
          <div className="container-dp">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="section-title">Акции</h2>
              <Link to="/promotions" className="text-sm font-semibold text-brand hover:underline">
                Все акции
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data!.promotions.map((p) => (
                <Link
                  key={p.id}
                  to="/promotions"
                  className="group relative min-h-[220px] overflow-hidden rounded-2xl"
                >
                  <img src={p.image || ''} alt={p.title} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-graphite/55" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    {p.discountPercent ? (
                      <span className="mb-2 w-fit rounded-md bg-brand px-2 py-1 text-xs font-bold">−{p.discountPercent}%</span>
                    ) : null}
                    <h3 className="font-display text-2xl font-semibold">{p.title}</h3>
                    <p className="mt-2 max-w-md text-sm text-white/75">{p.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-dp py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="section-title">Популярные товары</h2>
          <Link to="/catalog" className="text-sm font-semibold text-brand hover:underline">
            В каталог
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.featured || []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-graphite py-16 text-white md:py-20">
        <div className="container-dp grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold md:text-5xl">Подбор покрытия за 4 шага</h2>
            <p className="mt-4 max-w-lg text-white/70">
              Укажите помещение, приоритет, тёплый пол и стиль — покажем подходящие позиции из каталога.
            </p>
            <Link to="/picker" className="btn-primary mt-8">
              Запустить подбор
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Помещение', 'Приоритет', 'Тёплый пол', 'Стиль'].map((step, i) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-wide text-brand">Шаг {i + 1}</div>
                <div className="mt-2 font-display text-xl">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-16 md:py-20">
        <h2 className="section-title mb-8">Почему ДОМПОЛА</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(data?.advantages || []).map((a) => (
            <div key={a.id} className="rounded-2xl border border-graphite/8 bg-mist/60 p-6">
              <div className="mb-4 text-brand">{icons[a.icon || ''] || <Compass />}</div>
              <h3 className="font-display text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite/65">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-mist py-16 md:py-20">
        <div className="container-dp">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="section-title">Услуги</h2>
            <Link to="/services" className="text-sm font-semibold text-brand hover:underline">Все услуги</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(data?.services || []).map((s) => (
              <div key={s.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-graphite/65">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="section-title">Наши работы</h2>
          <Link to="/works" className="text-sm font-semibold text-brand hover:underline">Смотреть все</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.works || []).map((w) => (
            <article key={w.id} className="overflow-hidden rounded-2xl">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={w.image || ''} alt={w.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="pt-3">
                <h3 className="font-semibold">{w.title}</h3>
                <p className="text-sm text-graphite/55">{[w.city, w.category].filter(Boolean).join(' · ')}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-graphite py-16 text-white md:py-20">
        <div className="container-dp">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Магазины</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(data?.stores || []).map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-brand">{s.city?.name}</div>
                <h3 className="mt-1 font-display text-xl">{s.name}</h3>
                <p className="mt-3 text-sm text-white/70">{s.address}</p>
                <p className="mt-1 text-sm text-white/70">{s.schedule}</p>
                {s.phone ? <a href={`tel:${s.phone}`} className="mt-3 inline-block text-sm text-brand hover:underline">{s.phone}</a> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-dp py-16 md:py-20">
        <div className="grid gap-10 rounded-3xl bg-mist p-6 md:grid-cols-2 md:p-10">
          <div>
            <h2 className="section-title">Нужна консультация?</h2>
            <p className="mt-3 text-graphite/65">
              Оставьте заявку — поможем с выбором покрытия, расчётом количества и записью на замер.
            </p>
          </div>
          <LeadForm source="home_consult" />
        </div>
      </section>
    </>
  );
}
