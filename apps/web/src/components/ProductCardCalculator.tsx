import { useState } from 'react';
import { Calculator, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, hasPrice } from '../lib/api';
import {
  areaToPacks,
  canRoomCalculate,
  formatUnit,
  isPackPriced,
  isPackSold,
  lineTotal,
  packPrice,
  packsToArea,
  resolvePackArea,
} from '../lib/packaging';
import { useCart } from '../store/cart';
import { QtyStepper } from './QtyStepper';

type Props = {
  product: Product;
  compact?: boolean;
  returnState?: { from?: string };
  onBeforeNavigate?: () => void;
};

export function ProductCardCalculator({
  product,
  compact = false,
  returnState,
  onBeforeNavigate,
}: Props) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [showRoom, setShowRoom] = useState(false);
  const [roomArea, setRoomArea] = useState(20);

  const priced = hasPrice(product.price);
  const byPack = isPackSold(product);
  const packArea = resolvePackArea(product);
  const roomReady = canRoomCalculate(product);
  const pPack = packPrice(product);
  const discount =
    product.discountPercent ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);
  const selectedArea = roomReady ? packsToArea(qty, product) : null;
  const total = priced ? lineTotal(Math.max(1, qty), product) : 0;
  const showPackAlt = priced && byPack && pPack != null && !isPackPriced(product);
  const unitShort = formatUnit(product.unit, { short: true });
  const isM2 = normLooksM2(product.unit);

  function setQtyFromArea(m2: number) {
    setQty(areaToPacks(m2, product));
  }

  function goOrder() {
    if (!priced) return;
    const amount = Math.max(1, byPack ? Math.round(qty) : qty);
    onBeforeNavigate?.();
    add(product, amount);
    const qs = byPack ? `?packs=${Math.round(amount)}` : `?qty=${amount}`;
    navigate(`/product/${product.slug}${qs}`, { state: returnState });
  }

  if (!priced) {
    return (
      <button
        type="button"
        onClick={() => {
          onBeforeNavigate?.();
          navigate(`/product/${product.slug}`, { state: returnState });
        }}
        className="mt-auto w-full rounded-xl border border-graphite/15 bg-white py-2 text-xs font-semibold text-graphite transition hover:border-brand hover:text-brand sm:text-sm"
      >
        Подробнее
      </button>
    );
  }

  return (
    <div className={`mt-auto ${compact ? 'space-y-1.5' : 'space-y-2.5'}`}>
      <div>
        <div className="flex flex-wrap items-center gap-1">
          {discount ? (
            <span className="rounded-full bg-[#e11d48] px-1.5 py-0.5 text-[10px] font-bold text-white sm:px-2 sm:text-xs">
              −{discount}%
            </span>
          ) : null}
          {product.oldPrice && product.oldPrice > product.price ? (
            <span className="text-[11px] text-graphite/40 line-through sm:text-sm">
              {formatPrice(product.oldPrice)}
            </span>
          ) : null}
        </div>
        <div
          className={`font-bold leading-tight text-[#e11d48] ${compact ? 'text-sm sm:text-lg' : 'text-lg sm:text-xl'}`}
        >
          {formatPrice(product.price)}
          <span className="text-[11px] font-semibold sm:text-sm">/{unitShort}</span>
        </div>
        {showPackAlt ? (
          <div className={`font-semibold text-graphite ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>
            {formatPrice(pPack)}/упак
          </div>
        ) : null}
      </div>

      {/* Always show quantity calculator so cards look consistent */}
      <div className="rounded-xl border border-graphite/10 bg-white p-1.5 sm:p-2">
        {roomReady && packArea ? (
          <>
            <div className="mb-1.5 text-[10px] font-medium text-graphite/50 sm:text-xs">Площадь:</div>
            <div className="flex items-end gap-1">
              <div className="flex min-w-0 flex-1 items-end gap-1">
                <QtyStepper
                  compact={compact}
                  label="упак"
                  value={qty}
                  min={1}
                  step={1}
                  onChange={(n) => setQty(Math.max(1, Math.round(n)))}
                />
                <span className="mb-2.5 shrink-0 text-xs font-semibold text-graphite/35">=</span>
                <QtyStepper
                  compact={compact}
                  label="м²"
                  value={selectedArea || packArea}
                  min={packArea}
                  step={packArea}
                  displayValue={Number((selectedArea || packArea).toFixed(2))}
                  onChange={setQtyFromArea}
                />
              </div>
              <button
                type="button"
                aria-label="Калькулятор площади"
                onClick={() => setShowRoom((v) => !v)}
                className={`mb-0.5 grid shrink-0 place-items-center rounded-lg border transition ${
                  compact ? 'h-9 w-9' : 'h-11 w-11'
                } ${
                  showRoom
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-graphite/15 bg-mist text-graphite/60 hover:border-brand hover:text-brand'
                }`}
              >
                <Calculator size={compact ? 15 : 17} strokeWidth={1.75} />
              </button>
            </div>
            {showRoom ? (
              <div className="mt-1.5 rounded-lg bg-mist p-2">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-graphite/50">
                  Помещение, м²
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min={1}
                    value={roomArea}
                    onChange={(e) => setRoomArea(Number(e.target.value) || 1)}
                    className="w-full rounded-md border border-graphite/15 px-2 py-1.5 text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQty(areaToPacks(roomArea * 1.07, product));
                      setShowRoom(false);
                    }}
                    className="shrink-0 rounded-md bg-brand px-2 py-1.5 text-[10px] font-semibold text-white"
                  >
                    +7%
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : byPack ? (
          <>
            <div className="mb-1.5 text-[10px] font-medium text-graphite/50 sm:text-xs">Количество:</div>
            <QtyStepper
              compact={compact}
              label="упак"
              value={qty}
              min={1}
              step={1}
              onChange={(n) => setQty(Math.max(1, Math.round(n)))}
            />
          </>
        ) : (
          <>
            <div className="mb-1.5 text-[10px] font-medium text-graphite/50 sm:text-xs">Количество:</div>
            <QtyStepper
              compact={compact}
              label={isM2 ? 'м²' : unitShort || 'шт'}
              value={qty}
              min={isM2 ? 0.1 : 1}
              step={isM2 ? 0.1 : 1}
              displayValue={isM2 ? Number(qty.toFixed(1)) : Math.round(qty)}
              onChange={(n) => setQty(Math.max(isM2 ? 0.1 : 1, n))}
            />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={goOrder}
        className={`flex w-full items-center justify-between gap-2 rounded-xl bg-ink font-semibold text-white transition hover:bg-graphite active:scale-[0.98] ${
          compact ? 'px-2.5 py-2 text-[11px] sm:text-sm' : 'px-3 py-2.5 text-sm'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <ShoppingCart size={compact ? 14 : 16} />
          <span>В корзину</span>
        </span>
        <span className="shrink-0 tabular-nums">{formatPrice(total)}</span>
      </button>
    </div>
  );
}

function normLooksM2(unit?: string | null) {
  const u = String(unit || '')
    .toLowerCase()
    .replace(/\s+/g, '');
  return u === 'м²' || u === 'м2' || u.includes('м²') || u.includes('м2');
}
