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

type Props = {
  product: Product;
  /** Compact layout for 2-column mobile grids */
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
  const [packs, setPacks] = useState(1);
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
  const selectedArea = roomReady ? packsToArea(packs, product) : null;
  const total = priced ? lineTotal(byPack ? packs : packs, product) : 0;
  const showPackAlt = priced && byPack && pPack != null && !isPackPriced(product);
  // When price is per m², highlight м²; when per pack, highlight pack price
  const primaryIsM2 = priced && !isPackPriced(product) && (normLooksM2(product.unit) || packArea != null);

  function setPacksFromArea(m2: number) {
    setPacks(areaToPacks(m2, product));
  }

  function goOrder() {
    if (!priced) return;
    const qty = byPack ? packs : Math.max(1, packs);
    add(product, qty);
    onBeforeNavigate?.();
    const qs = byPack ? `?packs=${qty}` : '';
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
          <span className="text-[11px] font-semibold sm:text-sm">
            /{formatUnit(product.unit, { short: true })}
          </span>
        </div>
        {showPackAlt ? (
          <div className={`font-semibold text-graphite ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>
            {formatPrice(pPack)}/{formatUnit('упак', { short: true })}
          </div>
        ) : primaryIsM2 && pPack != null ? (
          <div className={`font-semibold text-graphite ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>
            {formatPrice(pPack)}/упак
          </div>
        ) : null}
      </div>

      {byPack ? (
        <div className="rounded-xl border border-graphite/10 bg-white p-1.5 sm:p-2">
          {roomReady && packArea ? (
            <>
              <div className="mb-1 text-[10px] font-medium text-graphite/50 sm:text-xs">Площадь:</div>
              <div className="flex items-stretch gap-1">
                <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-graphite/15">
                  <label className="flex min-w-0 flex-1 items-center gap-0.5 px-1.5 py-1.5 sm:px-2 sm:py-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={packs}
                      onChange={(e) => setPacks(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                      className="w-full min-w-0 border-0 bg-transparent text-xs font-semibold outline-none sm:text-sm"
                    />
                    <span className="shrink-0 text-[10px] text-graphite/50 sm:text-xs">упак</span>
                  </label>
                  <span className="px-0.5 text-[10px] text-graphite/30 sm:text-xs">=</span>
                  <label className="flex min-w-0 flex-1 items-center gap-0.5 px-1.5 py-1.5 sm:px-2 sm:py-2">
                    <input
                      type="number"
                      min={packArea}
                      step={0.1}
                      value={Number((selectedArea || packArea).toFixed(2))}
                      onChange={(e) => setPacksFromArea(Number(e.target.value) || packArea)}
                      className="w-full min-w-0 border-0 bg-transparent text-xs font-semibold outline-none sm:text-sm"
                    />
                    <span className="shrink-0 text-[10px] text-graphite/50 sm:text-xs">м²</span>
                  </label>
                </div>
                <button
                  type="button"
                  aria-label="Калькулятор площади"
                  onClick={() => setShowRoom((v) => !v)}
                  className={`grid shrink-0 place-items-center rounded-lg border transition ${
                    compact ? 'h-8 w-8' : 'h-10 w-10'
                  } ${
                    showRoom
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-graphite/15 bg-mist text-graphite/60 hover:border-brand hover:text-brand'
                  }`}
                >
                  <Calculator size={compact ? 14 : 16} strokeWidth={1.75} />
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
                      className="w-full rounded-md border border-graphite/15 px-2 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPacks(areaToPacks(roomArea * 1.07, product));
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
          ) : (
            <label className="flex items-center gap-1 rounded-lg border border-graphite/15 px-2 py-1.5">
              <input
                type="number"
                min={1}
                step={1}
                value={packs}
                onChange={(e) => setPacks(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                className="w-full min-w-0 border-0 bg-transparent text-xs font-semibold outline-none sm:text-sm"
              />
              <span className="shrink-0 text-[10px] text-graphite/50 sm:text-xs">упак</span>
            </label>
          )}
        </div>
      ) : null}

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
