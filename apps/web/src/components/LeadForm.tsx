import { useState, type FormEvent } from 'react';
import { api, USE_STATIC } from '../lib/api';
import { useCity } from '../store/city';

type LeadFormProps = {
  source?: string;
  productName?: string;
  compact?: boolean;
  submitLabel?: string;
};

const PHONE_HREF = 'tel:+79214994979';
const PHONE_LABEL = '+7 (921) 499-49-79';

export function LeadForm({
  source = 'site',
  productName,
  compact,
  submitLabel = 'Отправить заявку',
}: LeadFormProps) {
  const { city, cities, setCityId } = useCity();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState(productName ? `Интересует: ${productName}` : '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (USE_STATIC) {
    return (
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        <p className="text-sm text-graphite/70">
          Онлайн-заявка на сайте сейчас недоступна. Позвоните — ответим быстро.
        </p>
        <a href={PHONE_HREF} className="btn-primary inline-flex">
          {PHONE_LABEL}
        </a>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      await api('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          comment,
          source,
          cityId: city?.id,
        }),
      });
      setStatus('ok');
      setName('');
      setPhone('');
      setComment('');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Не удалось отправить. Попробуйте ещё раз.');
    }
  }

  const fieldClass =
    'w-full rounded-md border border-graphite/15 bg-white px-4 py-3 outline-none ring-brand focus:ring-2';

  return (
    <form onSubmit={onSubmit} className={compact ? 'space-y-3' : 'space-y-4'} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-graphite/55">Имя</span>
          <input
            required
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            aria-invalid={status === 'error' && !name ? true : undefined}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-graphite/55">
            Телефон
          </span>
          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 …"
            aria-invalid={status === 'error' && !phone ? true : undefined}
            className={fieldClass}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-graphite/55">Город</span>
        <select
          name="city"
          value={city?.id || ''}
          onChange={(e) => setCityId(e.target.value)}
          className={fieldClass}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-graphite/55">
          Комментарий
        </span>
        <textarea
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Что нужно подобрать?"
          rows={compact ? 2 : 4}
          className={fieldClass}
        />
      </label>
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full sm:w-auto">
        {status === 'loading' ? 'Отправляем…' : submitLabel}
      </button>
      {status === 'ok' ? (
        <p className="text-sm text-brand-dark" role="status">
          Заявка принята. Мы свяжемся с вами.
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage || 'Не удалось отправить. Попробуйте ещё раз.'}
        </p>
      ) : null}
    </form>
  );
}
