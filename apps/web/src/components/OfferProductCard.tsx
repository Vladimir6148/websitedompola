import { Layers, Truck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, primaryImage, stockLabel } from '../lib/api';
import { useCart } from '../store/cart';
import { useCity } from '../store/city';
import { SmartImage } from './SmartImage';

export function OfferProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { city } = useCity();
  const image = primaryImage(product);
  const stock = product.stocks?.find((s) => s.cityId === city?.id) || product.stocks?.[0];
  const inStock = !stock || stock.status === 'IN_STOCK';
  const discount =
    product.discountPercent ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-graphite/10 bg-white shadow-sm">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-mist">
        <SmartImage
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          className="h-full w-full object-cover"
        />
        {discount && product.oldPrice ? (
          <div className="absolute left-2 top-2 flex overflow-hidden rounded-full text-[11px] font-bold shadow-sm sm:left-3 sm:top-3 sm:text-xs">
            <span className="bg-[#e11d48] px-2 py-1 text-white sm:px-2.5">−{discount}%</span>
            <span className="bg-white px-2 py-1 text-graphite/45 line-through sm:px-2.5">
              {formatPrice(product.oldPrice)}
            </span>
          </div>
        ) : null}
        {inStock ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm sm:right-3 sm:top-3 sm:text-[11px]">
            <Zap size={12} className="fill-white text-white" />
            В наличии
          </span>
        ) : (
          <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-graphite/70 sm:right-3 sm:top-3">
            {stock ? stockLabel(stock.status) : 'Под заказ'}
          </span>
        )}
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
