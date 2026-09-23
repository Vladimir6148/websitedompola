import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../types';
import { primaryImage, fallbackImage } from '../lib/api';
import { rememberCurrentScroll, useReturnLinkState } from '../hooks/useReturnLinkState';
import { ProductCardCalculator } from './ProductCardCalculator';
import { SmartImage } from './SmartImage';

export function ProductCard({ product }: { product: Product }) {
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
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-graphite/8 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,92,40,0.1)] sm:rounded-2xl">
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
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {discount ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-[#e11d48] px-1.5 py-0.5 text-[10px] font-bold text-white sm:left-3 sm:top-3 sm:px-2 sm:py-1 sm:text-xs">
            −{discount}%
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-2 sm:gap-2 sm:p-3">
        <div className="truncate text-[10px] uppercase tracking-wide text-graphite/50 sm:text-xs">
          {product.brand?.name}
          {product.collection ? ` · ${product.collection.name}` : ''}
        </div>
        <Link
          to={productTo}
          state={returnState}
          onClick={remember}
          className="line-clamp-2 text-xs font-semibold leading-snug hover:text-brand sm:text-sm"
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
