import { ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, hasPrice, primaryImage } from '../lib/api';
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

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const location = useLocation();
  const returnState = useReturnLinkState();
  const productTo = `/product/${product.slug}`;
  const remember = () => rememberCurrentScroll(location.pathname, location.search);
  const image = primaryImage(product);
  const byPack = isPackSold(product);
  const area = resolvePackArea(product);
  const pPack = packPrice(product);
  const board = formatBoardSize(product);
  const priced = hasPrice(product.price);
  const showPackAlt = priced && byPack && pPack != null && !isPackPriced(product);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-graphite/8 bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,92,40,0.12)] sm:rounded-2xl">
      <Link to={productTo} state={returnState} onClick={remember} className="relative block aspect-square overflow-hidden bg-mist sm:aspect-[4/3]">
        <SmartImage
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {product.discountPercent ? (
          <span className="absolute left-2 top-2 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white sm:left-3 sm:top-3 sm:px-2 sm:py-1 sm:text-xs">
            −{product.discountPercent}%
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-3 sm:p-4">
        <div className="truncate text-[10px] uppercase tracking-wide text-graphite/50 sm:text-xs">
          {product.brand?.name}
          {product.collection ? ` · ${product.collection.name}` : ''}
        </div>
        <Link
          to={productTo}
          state={returnState}
          onClick={remember}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:text-brand sm:text-base"
        >
          {product.name}
        </Link>
        {(board || product.packQty || area) ? (
          <div className="hidden space-y-0.5 text-xs text-graphite/55 sm:block">
            {board ? <div>Доска {board}</div> : null}
            {product.packQty ? <div>{product.packQty} шт. в упаковке</div> : null}
            {area ? <div>{formatPackArea(area)} м² в упаковке</div> : null}
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight text-graphite sm:text-lg">
              {formatPrice(product.price)}
              {priced ? (
                <span className="text-[11px] font-semibold text-graphite/50 sm:text-sm">
                  /{formatUnit(product.unit, { short: true })}
                </span>
              ) : null}
            </div>
            {showPackAlt ? (
              <div className="hidden text-sm font-semibold text-graphite sm:block">
                {formatPrice(pPack)}/{formatUnit(product.unit, { short: true })}
              </div>
            ) : null}
            {priced && product.oldPrice ? (
              <div className="text-[11px] text-graphite/40 line-through sm:text-sm">{formatPrice(product.oldPrice)}</div>
            ) : null}
          </div>
          {priced ? (
            <button
              type="button"
              className="btn-primary shrink-0 !rounded-full !px-2.5 !py-2 sm:!px-3"
              onClick={() => add(product, 1)}
              aria-label="В корзину"
            >
              <ShoppingCart size={15} />
            </button>
          ) : (
            <Link
              to={productTo}
              state={returnState}
              onClick={remember}
              className="btn-secondary shrink-0 !px-2 !py-1.5 text-[10px] sm:!px-3 sm:!py-2 sm:text-xs"
            >
              Ещё
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
