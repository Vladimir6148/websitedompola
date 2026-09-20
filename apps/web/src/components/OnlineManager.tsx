import { useEffect, useState, type FormEvent } from 'react';
import { Headphones, X } from 'lucide-react';
import { api } from '../lib/api';

const DISMISS_KEY = 'dompola_manager_dismissed_at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 4; // 4 часа
const AUTO_OPEN_MS = 15_000;

type Step = 'ask' | 'form' | 'done';

function wasRecentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export function OnlineManager() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('ask');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (wasRecentlyDismissed()) return;
    const timer = window.setTimeout(() => setVisible(true), AUTO_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
    setStep('ask');
    setStatus('idle');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      await api('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          comment: 'Заказ звонка из онлайн-менеджера',
          source: 'online_manager',
        }),
      });
      setStep('done');
      setStatus('idle');
      window.setTimeout(dismiss, 3500);
    } catch {
      setStatus('error');
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-[5.25rem] right-4 z-[70] w-[min(100vw-2rem,20rem)] md:bottom-6 md:right-6">
      <div className="overflow-hidden rounded-2xl border border-graphite/10 bg-white shadow-[0_16px_40px_rgba(15,40,20,0.18)]">
        <div className="flex items-center justify-between gap-2 bg-graphite px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white">
              <Headphones size={16} />
            </span>
            <div>
              <div className="text-sm font-semibold">Онлайн-менеджер</div>
              <div className="text-[11px] text-white/55">ДОМПОЛА</div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Закрыть"
            className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          {step === 'ask' ? (
            <div>
              <p className="font-display text-lg font-semibold text-graphite">Требуется ли помощь?</p>
              <p className="mt-1 text-sm text-graphite/60">
                Подскажем по покрытию, расчёту и наличию в салоне.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  Да, нужна
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="flex-1 rounded-md border border-graphite/15 px-3 py-2.5 text-sm font-semibold text-graphite transition hover:border-brand hover:text-brand"
                >
                  Нет, спасибо
                </button>
              </div>
            </div>
          ) : null}

          {step === 'form' ? (
            <form onSubmit={onSubmit} className="space-y-3">
              <p className="text-sm font-semibold text-graphite">Оставьте контакты — перезвоним</p>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                autoComplete="name"
                className="w-full rounded-md border border-graphite/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="w-full rounded-md border border-graphite/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {status === 'loading' ? 'Отправляем…' : 'Заказать звонок'}
              </button>
              {status === 'error' ? (
                <p className="text-xs text-red-600">Не удалось отправить. Попробуйте ещё раз.</p>
              ) : null}
            </form>
          ) : null}

          {step === 'done' ? (
            <div className="py-2 text-center">
              <p className="font-display text-lg font-semibold text-graphite">Заявка принята</p>
              <p className="mt-1 text-sm text-graphite/60">Менеджер свяжется с вами в ближайшее время.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
