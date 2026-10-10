import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { api, formatPrice } from '../../lib/api';
import { adminInputClass, adminLabelClass, adminPanelClass, adminSelectClass } from './adminUi';

type OpsStore = { id: string; name: string; city: string };
type OpsEmployee = { id: string; name: string; sortOrder: number };
type OpsEvent = { id: string; title: string; date: string; note?: string | null };
type OpsTurnover = {
  id: string;
  storeId: string;
  date: string;
  amount: number;
  note?: string | null;
  store?: { name: string; city?: { name: string } };
};
type OpsShift = { id: string; employeeId: string; date: string };
type StoreTotal = { storeId: string; name: string; city: string; total: number };

type DashboardPayload = {
  year: number;
  month: number;
  events: OpsEvent[];
  turnovers: OpsTurnover[];
  storeTotals: StoreTotal[];
  monthTotal: number;
  employees: OpsEmployee[];
  shifts: OpsShift[];
  stores: OpsStore[];
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** Monday=0 … Sunday=6 for calendar grid */
function mondayIndex(year: number, month: number, day: number) {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 ? 6 : d - 1;
}

function isWeekend(year: number, month: number, day: number) {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 || d === 6;
}

function eventDateKey(raw: string) {
  return String(raw).slice(0, 10);
}

export function AdminOpsDashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(ymd(now.getFullYear(), now.getMonth() + 1, now.getDate()));
  const [turnStoreId, setTurnStoreId] = useState('');
  const [turnDate, setTurnDate] = useState(ymd(now.getFullYear(), now.getMonth() + 1, now.getDate()));
  const [turnAmount, setTurnAmount] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<DashboardPayload>(`/api/ops/dashboard?year=${year}&month=${month}`);
      setData(res);
      setTurnStoreId((prev) => prev || res.stores[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить операционные данные');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const dim = daysInMonth(year, month);
  const shiftSet = useMemo(() => {
    const s = new Set<string>();
    for (const sh of data?.shifts || []) s.add(`${sh.employeeId}|${sh.date}`);
    return s;
  }, [data?.shifts]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, OpsEvent[]>();
    for (const e of data?.events || []) {
      const k = eventDateKey(e.date);
      const list = map.get(k) || [];
      list.push(e);
      map.set(k, list);
    }
    return map;
  }, [data?.events]);

  const maxStoreTotal = Math.max(1, ...(data?.storeTotals.map((s) => s.total) || [1]));

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
    setSelectedDay(null);
  }

  async function addEvent() {
    if (!eventTitle.trim()) return;
    setBusy(true);
    try {
      await api('/api/ops/events', {
        method: 'POST',
        body: JSON.stringify({ title: eventTitle.trim(), date: eventDate }),
      });
      setEventTitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function removeEvent(id: string) {
    setBusy(true);
    try {
      await api(`/api/ops/events/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function saveTurnover() {
    const amount = Number(String(turnAmount).replace(/\s/g, '').replace(',', '.'));
    if (!turnStoreId || !Number.isFinite(amount) || amount < 0) {
      setError('Укажите магазин и сумму');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/api/ops/turnovers', {
        method: 'POST',
        body: JSON.stringify({ storeId: turnStoreId, date: turnDate, amount }),
      });
      setTurnAmount('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function toggleShift(employeeId: string, day: number) {
    const date = ymd(year, month, day);
    setBusy(true);
    try {
      const res = await api<{ work: boolean }>('/api/ops/shifts/toggle', {
        method: 'POST',
        body: JSON.stringify({ employeeId, date }),
      });
      setData((prev) => {
        if (!prev) return prev;
        const key = `${employeeId}|${date}`;
        let shifts = prev.shifts.filter((s) => `${s.employeeId}|${s.date}` !== key);
        if (res.work) shifts = [...shifts, { id: key, employeeId, date }];
        return { ...prev, shifts };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка графика');
    } finally {
      setBusy(false);
    }
  }

  const dayTotals = useMemo(() => {
    const totals = Array.from({ length: dim }, () => 0);
    for (const emp of data?.employees || []) {
      for (let d = 1; d <= dim; d++) {
        if (shiftSet.has(`${emp.id}|${ymd(year, month, d)}`)) totals[d - 1]! += 1;
      }
    }
    return totals;
  }, [data?.employees, shiftSet, dim, year, month]);

  const empTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const emp of data?.employees || []) {
      let n = 0;
      for (let d = 1; d <= dim; d++) {
        if (shiftSet.has(`${emp.id}|${ymd(year, month, d)}`)) n += 1;
      }
      map.set(emp.id, n);
    }
    return map;
  }, [data?.employees, shiftSet, dim, year, month]);

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) || [] : [];

  if (loading && !data) {
    return (
      <div className={`${adminPanelClass} flex items-center gap-2 text-sm text-graphite/55`}>
        <Loader2 size={16} className="animate-spin" />
        Загрузка календаря и графика…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-graphite">Операции</h2>
          <p className="text-sm text-graphite/55">События, оборот магазинов и график смен</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-graphite/15 bg-white p-1">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-mist"
            onClick={() => shiftMonth(-1)}
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-graphite">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-mist"
            onClick={() => shiftMonth(1)}
            aria-label="Следующий месяц"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Calendar + events */}
        <section className={adminPanelClass}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-graphite">Календарь событий</h3>
            <span className="text-xs text-graphite/45">{data?.events.length || 0} в месяце</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-graphite/45">
            {WEEKDAYS.map((w) => (
              <div key={w} className={w === 'Сб' || w === 'Вс' ? 'text-red-500/80' : ''}>
                {w}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: mondayIndex(year, month, 1) }).map((_, i) => (
              <div key={`e${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
              const key = ymd(year, month, day);
              const evs = eventsByDay.get(key) || [];
              const weekend = isWeekend(year, month, day);
              const on = selectedDay === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedDay(key);
                    setEventDate(key);
                  }}
                  className={`relative aspect-square rounded-lg border text-sm transition ${
                    on
                      ? 'border-brand bg-brand/10 font-semibold text-brand-dark'
                      : weekend
                        ? 'border-red-100 bg-red-50/80 text-red-700 hover:border-red-200'
                        : 'border-graphite/8 bg-mist/40 text-graphite hover:border-brand/30'
                  }`}
                >
                  {day}
                  {evs.length ? (
                    <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {evs.slice(0, 3).map((e) => (
                        <span key={e.id} className="h-1 w-1 rounded-full bg-brand" />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 border-t border-graphite/8 pt-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                className={adminInputClass}
                placeholder="Новое событие"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
              <input
                type="date"
                className={adminInputClass}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary inline-flex items-center justify-center gap-1"
                disabled={busy || !eventTitle.trim()}
                onClick={() => void addEvent()}
              >
                <Plus size={16} />
                Добавить
              </button>
            </div>
            <ul className="max-h-36 space-y-1 overflow-y-auto text-sm">
              {(selectedDay ? selectedEvents : data?.events || []).map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-graphite/8 px-2.5 py-1.5"
                >
                  <div>
                    <div className="font-medium text-graphite">{e.title}</div>
                    <div className="text-xs text-graphite/45">{eventDateKey(e.date)}</div>
                  </div>
                  <button
                    type="button"
                    className="text-graphite/40 hover:text-red-600"
                    onClick={() => void removeEvent(e.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
              {!selectedEvents.length && selectedDay ? (
                <li className="text-xs text-graphite/45">На эту дату событий нет</li>
              ) : null}
            </ul>
          </div>
        </section>

        {/* Turnover */}
        <section className={adminPanelClass}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-graphite">Поступления по магазинам</h3>
            <span className="text-sm font-semibold text-brand-dark">
              {formatPrice(data?.monthTotal || 0)}
            </span>
          </div>

          <div className="space-y-2">
            {(data?.storeTotals || []).map((s) => {
              const pct = Math.round((s.total / maxStoreTotal) * 100);
              return (
                <div key={s.storeId}>
                  <div className="mb-0.5 flex justify-between gap-2 text-sm">
                    <span className="truncate text-graphite">
                      {s.city ? `${s.city}` : s.name}
                      <span className="text-graphite/40"> · {s.name.replace(/^ДомПола\s*[—-]\s*/i, '')}</span>
                    </span>
                    <span className="shrink-0 font-medium">{formatPrice(s.total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-mist">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${s.total > 0 ? Math.max(pct, 4) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!data?.storeTotals.length ? (
              <p className="text-sm text-graphite/45">Нет данных за месяц — внесите поступление ниже.</p>
            ) : null}
          </div>

          <div className="mt-4 space-y-2 border-t border-graphite/8 pt-3">
            <div className={adminLabelClass}>Внести поступление</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className={adminSelectClass}
                value={turnStoreId}
                onChange={(e) => setTurnStoreId(e.target.value)}
              >
                {(data?.stores || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.city || s.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className={adminInputClass}
                value={turnDate}
                onChange={(e) => setTurnDate(e.target.value)}
              />
              <input
                type="number"
                min={0}
                step={1}
                className={adminInputClass}
                placeholder="Сумма, ₽"
                value={turnAmount}
                onChange={(e) => setTurnAmount(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => void saveTurnover()}
              >
                Сохранить день
              </button>
            </div>
            <p className="text-xs text-graphite/45">
              Повторная запись на ту же дату и магазин перезапишет сумму. Анализ — сумма за выбранный месяц.
            </p>
          </div>
        </section>
      </div>

      {/* Schedule */}
      <section className={adminPanelClass}>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-semibold text-graphite">График работы</h3>
            <p className="text-sm text-graphite/55">
              Клик по ячейке — выход / рабочий день. Зелёный — смена, красные колонки — выходные.
            </p>
          </div>
          {busy ? <Loader2 size={16} className="animate-spin text-graphite/40" /> : null}
        </div>

        <div className="overflow-x-auto rounded-xl border border-graphite/8">
          <table className="min-w-max border-collapse text-xs">
            <thead>
              <tr className="bg-mist/70">
                <th className="sticky left-0 z-10 bg-mist/90 px-2 py-1.5 text-left font-semibold text-graphite">
                  Сотрудник
                </th>
                {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
                  const weekend = isWeekend(year, month, day);
                  const wd = WEEKDAYS[mondayIndex(year, month, day)];
                  return (
                    <th
                      key={day}
                      className={`min-w-[28px] px-0.5 py-1 text-center font-semibold ${
                        weekend ? 'bg-red-100 text-red-700' : 'text-graphite/70'
                      }`}
                    >
                      <div className="text-[10px] leading-none opacity-70">{wd}</div>
                      <div>{day}</div>
                    </th>
                  );
                })}
                <th className="px-2 py-1.5 font-semibold text-graphite">Итого</th>
              </tr>
            </thead>
            <tbody>
              {(data?.employees || []).map((emp) => (
                <tr key={emp.id} className="border-t border-graphite/8">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1 font-medium text-graphite">
                    {emp.name}
                  </td>
                  {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
                    const date = ymd(year, month, day);
                    const on = shiftSet.has(`${emp.id}|${date}`);
                    const weekend = isWeekend(year, month, day);
                    return (
                      <td key={date} className={`p-0.5 ${weekend ? 'bg-red-50/50' : ''}`}>
                        <button
                          type="button"
                          title={`${emp.name} · ${date}`}
                          disabled={busy}
                          onClick={() => void toggleShift(emp.id, day)}
                          className={`mx-auto block h-6 w-6 rounded-md border transition ${
                            on
                              ? 'border-brand bg-brand shadow-sm'
                              : 'border-graphite/15 bg-white hover:border-brand/40'
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 text-center font-semibold text-graphite">
                    {empTotals.get(emp.id) || 0}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-graphite/15 bg-mist/50">
                <td className="sticky left-0 z-10 bg-mist/80 px-2 py-1.5 font-semibold text-graphite">
                  В смене
                </td>
                {dayTotals.map((n, i) => (
                  <td key={i} className="px-0.5 py-1.5 text-center font-semibold text-graphite/70">
                    {n || ''}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-semibold text-graphite">
                  {dayTotals.reduce((a, b) => a + b, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
