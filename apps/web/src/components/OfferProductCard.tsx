import { BadgePercent, Layers, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, primaryImage } from '../lib/api';
import { useCart } from '../store/cart';
import { SmartImage } from './SmartImage';

export function OfferProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const image = primaryImage(product);
  const discount =
    product.discountPercent ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);
  const hasDeal = Boolean(discount && product.oldPrice && product.oldPrice > product.price);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-graphite/10 bg-white shadow-sm">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-mist">
        <SmartImage
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          className="h-full w-full object-cover"
        />
        {hasDeal ? (
          <div className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
            <div className="relative inline-block">
              <div className="flex overflow-hidden rounded-full text-[10px] font-bold leading-none shadow-sm sm:text-[11px]">
                <span className="bg-[#e11d48] px-2 py-1.5 text-white sm:px-2.5">−{discount}%</span>
                <span className="bg-white px-2 py-1.5 text-graphite/45 line-through sm:px-2.5">
                  {formatPrice(product.oldPrice!)}
                </span>
              </div>
              <span className="absolute left-0 top-[calc(100%+6px)] inline-flex w-full items-center justify-center gap-0.5 rounded-full bg-brand px-1.5 py-1.5 text-[9px] font-bold uppercase leading-none tracking-wide text-white shadow-sm sm:gap-1 sm:text-[10px]">
                <BadgePercent size={11} className="shrink-0" />
                <span className="truncate">Выгодная цена</span>
              </span>
              <div className="h-8" aria-hidden />
            </div>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="text-lg font-bold leading-none text-[#e11d48] sm:text-xl">
          {formatPrice(product.price)}
          <span className="ml-0.5 text-sm font-semibold">/{product.unit}</span>
        </div>
        <Link
          to={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-graphite hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="mt-1 space-y-1 text-xs text-graphite/55">
          <div className="flex items-center gap-1.5">
            <Truck size={13} />
            Доставим завтра
          </div>
          <div className="flex items-center gap-1.5">
            <Layers size={13} />
            Поможем уложить
          </div>
        </div>
        <button
          type="button"
          onClick={() => add(product)}
          className="mt-auto w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,138,61,0.28)] transition hover:bg-brand-dark active:scale-[0.98]"
        >
          В корзину
        </button>
      </div>
    </article>
  );
}
