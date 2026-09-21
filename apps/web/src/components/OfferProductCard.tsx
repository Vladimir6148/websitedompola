import { BadgePercent, Layers, Truck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, primaryImage } from '../lib/api';
import {
  formatBoardSize,
  formatPackArea,
  formatUnit,
  isPackPriced,
  isPackSold,
  packPrice,
  resolvePackArea,
} from '../lib/packaging';
import { rememberCurrentScroll, useReturnLinkState } from '../hooks/useReturnLinkState';
import { useCart } from '../store/cart';
import { SmartImage } from './SmartImage';

export function OfferProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const location = useLocation();
  const returnState = useReturnLinkState();
  const productTo = `/product/${product.slug}`;
  const remember = () => rememberCurrentScroll(location.pathname, location.search);
  const image = primaryImage(product);
  const discount =
    product.discountPercent ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);
  const hasDeal = Boolean(discount && product.oldPrice && product.oldPrice > product.price);
  const byPack = isPackSold(product);
  const area = resolvePackArea(product);
  const pPack = packPrice(product);
  const board = formatBoardSize(product);
  const showPackAlt = byPack && pPack != null && !isPackPriced(product);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-graphite/10 bg-white shadow-sm">
      <Link
        to={productTo}
        state={returnState}
        onClick={remember}
        className="relative block aspect-square overflow-hidden bg-mist"
      >
        <SmartImage
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          className="h-full w-full object-cover"
          priority={priority}
        />
        {hasDeal ? (
          <div className="absolute left-2 right-2 top-2 z-10 flex flex-wrap items-center gap-1.5 sm:left-3 sm:right-3 sm:top-3">
            <div className="flex overflow-hidden rounded-full text-[10px] font-bold leading-none shadow-sm sm:text-[11px]">
              <span className="bg-[#e11d48] px-2 py-1.5 text-white sm:px-2.5">−{discount}%</span>
              <span className="bg-white px-2 py-1.5 text-graphite/45 line-through sm:px-2.5">
                {formatPrice(product.oldPrice!)}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-1.5 text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-sm sm:px-2.5 sm:text-[11px]">
              <BadgePercent size={12} className="shrink-0" />
              Выгодная цена
            </span>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div>
          <div className="text-lg font-bold leading-none text-[#e11d48] sm:text-xl">
            {formatPrice(product.price)}
            <span className="ml-0.5 text-sm font-semibold">/{formatUnit(product.unit, { short: true })}</span>
          </div>
          {showPackAlt ? (
            <div className="mt-1 text-sm font-semibold text-graphite">
              {formatPrice(pPack)}/{formatUnit(product.unit, { short: true })}
            </div>
          ) : null}
        </div>
        <Link
          to={productTo}
          state={returnState}
          onClick={remember}
          className="line-clamp-2 text-sm font-medium leading-snug text-graphite hover:text-brand"
        >
          {product.name}
        </Link>
        {(board || product.packQty || area) ? (
          <div className="space-y-0.5 text-xs text-graphite/55">
            {board ? <div>Доска {board}</div> : null}
            {product.packQty ? <div>{product.packQty} шт. в упаковке</div> : null}
            {area ? <div>{formatPackArea(area)} м² в упаковке</div> : null}
          </div>
        ) : null}
        <div className="mt-1 space-y-1 text-xs text-graphite/55">
          <div className="flex items-center gap-1.5">
            <Truck size={13} />
            Доставка по региону
          </div>
          <div className="flex items-center gap-1.5">
            <Layers size={13} />
            Поможем уложить
          </div>
        </div>
        <button
          type="button"
          onClick={() => add(product, 1)}
          className="mt-auto w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,138,61,0.28)] transition hover:bg-brand-dark active:scale-[0.98]"
        >
          В корзину
        </button>
      </div>
    </article>
  );
}
