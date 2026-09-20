import { useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { useCity } from '../store/city';

type LeadFormProps = {
  source?: string;
  productName?: string;
  compact?: boolean;
  submitLabel?: string;
};

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
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
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
          className="rounded-md border border-graphite/15 bg-white px-4 py-3 outline-none ring-brand focus:ring-2"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон"
          className="rounded-md border border-graphite/15 bg-white px-4 py-3 outline-none ring-brand focus:ring-2"
        />
      </div>
      <select
        value={city?.id || ''}
        onChange={(e) => setCityId(e.target.value)}
        className="w-full rounded-md border border-graphite/15 bg-white px-4 py-3 outline-none ring-brand focus:ring-2"
      >
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Комментарий"
        rows={compact ? 2 : 4}
        className="w-full rounded-md border border-graphite/15 bg-white px-4 py-3 outline-none ring-brand focus:ring-2"
      />
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full sm:w-auto">
        {status === 'loading' ? 'Отправляем…' : submitLabel}
      </button>
      {status === 'ok' ? (
        <p className="text-sm text-brand-dark">Заявка принята. Мы свяжемся с вами.</p>
      ) : null}
      {status === 'error' ? (
        <p className="text-sm text-red-600">Не удалось отправить. Попробуйте ещё раз.</p>
      ) : null}
    </form>
  );
}
