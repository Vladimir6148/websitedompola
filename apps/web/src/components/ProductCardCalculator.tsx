import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, hasPrice } from '../lib/api';
import { packPrice, pricePerM2 } from '../lib/packaging';

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
  const navigate = useNavigate();
  const priced = hasPrice(product.price);
  const m2 = priced ? pricePerM2(product) : null;
  const pPack = priced ? packPrice(product) : null;
  const discount =
    product.discountPercent ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);

  function goProduct() {
    onBeforeNavigate?.();
    navigate(`/product/${product.slug}`, { state: returnState });
  }

  const cartButton = (
    <button
      type="button"
      onClick={goProduct}
      className={`flex w-full items-center justify-center gap-1.5 rounded-xl border border-graphite/15 bg-[#e8ebe8] font-semibold text-[#0b0d0c] transition hover:bg-[#dfe3df] active:scale-[0.98] ${
        compact ? 'px-2 py-1.5 text-[10px] sm:text-xs' : 'px-2.5 py-2 text-xs sm:text-sm'
      }`}
    >
      <ShoppingBag size={compact ? 13 : 15} strokeWidth={2} className="text-[#0b0d0c]" />
      <span>В корзину</span>
    </button>
  );

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
          {m2 != null ? formatPrice(m2) : '—'}
          <span className={`font-semibold ${compact ? 'text-[11px] sm:text-sm' : 'text-sm'}`}>/м²</span>
        </div>
        {pPack != null ? (
          <div
            className={`font-semibold leading-tight text-graphite ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}
          >
            {formatPrice(pPack)}/упак
          </div>
        ) : null}
      </div>

      {cartButton}
    </div>
  );
}
