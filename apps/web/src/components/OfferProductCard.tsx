import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../types';
import { primaryImage, fallbackImage } from '../lib/api';
import { rememberCurrentScroll, useReturnLinkState } from '../hooks/useReturnLinkState';
import { ProductCardCalculator } from './ProductCardCalculator';
import { SmartImage } from './SmartImage';

export function OfferProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const location = useLocation();
  const returnState = useReturnLinkState();
  const productTo = `/product/${product.slug}`;
  const remember = () => rememberCurrentScroll(location.pathname, location.search);
  const image = primaryImage(product);
  const imageFallback = fallbackImage(product);
  const discount =
    product.discountPercent ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-graphite/10 bg-white shadow-sm">
      <Link
        to={productTo}
        state={returnState}
        onClick={remember}
        className="relative block w-full shrink-0 overflow-hidden bg-mist aspect-[10/9]"
      >
        <SmartImage
          src={image}
          fallback={imageFallback}
          alt={product.images?.[0]?.alt || product.name}
          className="absolute inset-0 h-full w-full object-cover"
          priority={priority}
        />
        {discount ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-[#e11d48] px-2 py-1 text-[10px] font-bold text-white sm:left-3 sm:top-3 sm:text-xs">
            −{discount}%
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3">
        <Link
          to={productTo}
          state={returnState}
          onClick={remember}
          className="line-clamp-2 text-sm font-medium leading-snug text-graphite hover:text-brand"
        >
          {product.name}
        </Link>
        <ProductCardCalculator
          product={product}
          compact
          returnState={returnState}
          onBeforeNavigate={remember}
        />
      </div>
    </article>
  );
}
