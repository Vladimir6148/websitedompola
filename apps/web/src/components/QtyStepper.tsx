import { Minus, Plus } from 'lucide-react';

const inputNoSpinner =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

type Props = {
  label: string;
  value: number;
  min?: number;
  step?: number;
  displayValue?: string | number;
  onChange: (next: number) => void;
  compact?: boolean;
};

/** Horizontal − value unit + control. */
export function QtyStepper({
  label,
  value,
  min = 1,
  step = 1,
  displayValue,
  onChange,
  compact = false,
}: Props) {
  const shown = displayValue ?? value;

  function bump(dir: -1 | 1) {
    const next = Number((value + dir * step).toFixed(step < 1 ? 2 : 0));
    onChange(Math.max(min, next));
  }

  const btn =
    'grid shrink-0 place-items-center rounded-lg bg-white text-graphite/70 shadow-sm ring-1 ring-graphite/10 transition hover:bg-brand hover:text-white hover:ring-brand active:scale-95';

  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-1 rounded-xl bg-mist/80 ring-1 ring-graphite/8 ${
        compact ? 'h-10 px-1' : 'h-12 px-1.5'
      }`}
    >
      <button
        type="button"
        aria-label={`Уменьшить ${label}`}
        onClick={() => bump(-1)}
        className={`${btn} ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
      >
        <Minus size={compact ? 14 : 16} strokeWidth={2.25} />
      </button>
      <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1 px-0.5">
        <input
          type="number"
          min={min}
          step={step}
          value={shown}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(Math.max(min, step < 1 ? n : Math.round(n)));
          }}
          className={`w-full min-w-0 border-0 bg-transparent text-center font-semibold tabular-nums text-graphite outline-none ${inputNoSpinner} ${
            compact ? 'text-sm' : 'text-base'
          }`}
        />
        <span
          className={`shrink-0 font-medium text-graphite/45 ${compact ? 'text-[10px]' : 'text-xs'}`}
        >
          {label}
        </span>
      </label>
      <button
        type="button"
        aria-label={`Увеличить ${label}`}
        onClick={() => bump(1)}
        className={`${btn} ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
      >
        <Plus size={compact ? 14 : 16} strokeWidth={2.25} />
      </button>
    </div>
  );
}
