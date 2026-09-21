import { useState } from 'react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import type { Product } from '../types';

const rooms = [
  { id: 'living', label: 'Гостиная' },
  { id: 'bedroom', label: 'Спальня' },
  { id: 'kitchen', label: 'Кухня' },
  { id: 'hallway', label: 'Прихожая' },
  { id: 'kids', label: 'Детская' },
  { id: 'commercial', label: 'Коммерческое' },
] as const;

const priorities = [
  { id: 'price', label: 'Цена' },
  { id: 'moisture', label: 'Влагостойкость' },
  { id: 'durability', label: 'Прочность' },
  { id: 'look', label: 'Внешний вид' },
  { id: 'care', label: 'Лёгкий уход' },
] as const;

const heating = [
  { id: 'yes', label: 'Да' },
  { id: 'no', label: 'Нет' },
  { id: 'unknown', label: 'Не знаю' },
] as const;

const styles = [
  { id: 'light', label: 'Светлый' },
  { id: 'natural', label: 'Натуральный' },
  { id: 'dark', label: 'Тёмный' },
  { id: 'modern', label: 'Современный' },
  { id: 'classic', label: 'Классический' },
] as const;

export function PickerPage() {
  const [step, setStep] = useState(0);
  const [room, setRoom] = useState<(typeof rooms)[number]['id']>('living');
  const [priority, setPriority] = useState<(typeof priorities)[number]['id']>('look');
  const [heat, setHeat] = useState<(typeof heating)[number]['id']>('unknown');
  const [style, setStyle] = useState<(typeof styles)[number]['id']>('natural');
  const [items, setItems] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function finish() {
    setLoading(true);
    try {
      const res = await api<{ items: Product[] }>('/api/picker', {
        method: 'POST',
        body: JSON.stringify({ room, priority, heating: heat, style }),
      });
      setItems(res.items);
      setStep(4);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Seo title="Подбор покрытия" path="/picker" description="Интерактивный подбор напольного покрытия ДОМПОЛА" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Подбор покрытия</h1>
        <p className="mt-3 max-w-2xl text-graphite/60">Ответьте на несколько вопросов — подберём варианты из живого каталога.</p>

        <div className="mt-8 max-w-3xl rounded-3xl border border-graphite/8 bg-white p-6 md:p-8">
          {step < 4 ? (
            <>
              <div className="mb-6 flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-mist'}`} />
                ))}
              </div>

              {step === 0 ? (
                <Choice title="Помещение" options={rooms} value={room} onChange={setRoom} />
              ) : null}
              {step === 1 ? (
                <Choice title="Приоритет" options={priorities} value={priority} onChange={setPriority} />
              ) : null}
              {step === 2 ? (
                <Choice title="Тёплый пол" options={heating} value={heat} onChange={setHeat} />
              ) : null}
              {step === 3 ? (
                <Choice title="Стиль" options={styles} value={style} onChange={setStyle} />
              ) : null}

              <div className="mt-8 flex gap-3">
                {step > 0 ? (
                  <button type="button" className="btn-secondary" onClick={() => setStep((s) => s - 1)}>
                    Назад
                  </button>
                ) : null}
                {step < 3 ? (
                  <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)}>
                    Далее
                  </button>
                ) : (
                  <button type="button" className="btn-primary" disabled={loading} onClick={finish}>
                    {loading ? 'Подбираем…' : 'Показать товары'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-semibold">Подходящие варианты</h2>
              <button type="button" className="mt-2 text-sm text-brand" onClick={() => { setStep(0); setItems(null); }}>
                Пройти заново
              </button>
            </div>
          )}
        </div>

        {items ? (
          <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

function Choice<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`rounded-xl border px-4 py-4 text-left font-medium transition ${
              value === o.id ? 'border-brand bg-brand/5 text-brand-dark' : 'border-graphite/10 hover:border-brand/40'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
