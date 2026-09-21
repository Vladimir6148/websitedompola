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

/** Large − / + above the value — easier than native number spinners. */
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

  return (
    <div className="flex min-w-0 flex-1 flex-col items-stretch gap-0.5">
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          aria-label={`Уменьшить ${label}`}
          onClick={() => bump(-1)}
          className={`grid place-items-center rounded-md border border-graphite/15 bg-mist text-graphite transition hover:border-brand hover:bg-brand hover:text-white active:scale-95 ${
            compact ? 'h-8 w-8' : 'h-9 w-9'
          }`}
        >
          <Minus size={compact ? 14 : 15} strokeWidth={2.25} className="text-graphite/55" />
        </button>
        <button
          type="button"
          aria-label={`Увеличить ${label}`}
          onClick={() => bump(1)}
          className={`grid place-items-center rounded-md border border-graphite/15 bg-mist text-graphite transition hover:border-brand hover:bg-brand hover:text-white active:scale-95 ${
            compact ? 'h-8 w-8' : 'h-9 w-9'
          }`}
        >
          <Plus size={compact ? 14 : 15} strokeWidth={2.25} className="text-graphite/55" />
        </button>
      </div>
      <label
        className={`flex items-center justify-center gap-1 rounded-md border border-graphite/15 bg-white ${
          compact ? 'px-1.5 py-1' : 'px-2 py-1.5'
        }`}
      >
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
          className={`w-full min-w-0 border-0 bg-transparent text-center font-semibold outline-none ${inputNoSpinner} ${
            compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
          }`}
        />
        <span className={`shrink-0 text-graphite/50 ${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'}`}>
          {label}
        </span>
      </label>
    </div>
  );
}
