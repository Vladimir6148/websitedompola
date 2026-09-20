import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, hasPrice, primaryImage } from '../lib/api';
import {
  formatBoardSize,
  formatPackArea,
  isPackSold,
  packPrice,
  resolvePackArea,
} from '../lib/packaging';
import { useCart } from '../store/cart';
import { SmartImage } from './SmartImage';

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const image = primaryImage(product);
  const byPack = isPackSold(product);
  const area = resolvePackArea(product);
  const pPack = packPrice(product);
  const board = formatBoardSize(product);
  const priced = hasPrice(product.price);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-graphite/8 bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,92,40,0.12)]">
      <Link to={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-mist">
        <SmartImage
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {product.discountPercent ? (
          <span className="absolute left-3 top-3 rounded-md bg-brand px-2 py-1 text-xs font-bold text-white">
            −{product.discountPercent}%
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="text-xs uppercase tracking-wide text-graphite/50">
          {product.brand?.name}
          {product.collection ? ` · ${product.collection.name}` : ''}
        </div>
        <Link to={`/product/${product.slug}`} className="line-clamp-2 font-semibold leading-snug hover:text-brand">
          {product.name}
        </Link>
        {(board || product.packQty || area) ? (
          <div className="space-y-0.5 text-xs text-graphite/55">
            {board ? <div>Доска {board}</div> : null}
            {product.packQty ? <div>{product.packQty} шт. в упаковке</div> : null}
            {area ? <div>{formatPackArea(area)} м² в упаковке</div> : null}
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-graphite">
              {formatPrice(product.price)}
              {priced ? <span className="text-sm font-semibold text-graphite/50">/{product.unit}</span> : null}
            </div>
            {priced && byPack && pPack != null ? (
              <div className="text-sm font-semibold text-graphite">{formatPrice(pPack)}/упак</div>
            ) : null}
            {priced && product.oldPrice ? (
              <div className="text-sm text-graphite/40 line-through">{formatPrice(product.oldPrice)}</div>
            ) : null}
          </div>
          {priced ? (
            <button
              type="button"
              className="btn-primary px-3 py-2"
              onClick={() => add(product, 1)}
              aria-label="В корзину"
            >
              <ShoppingCart size={16} />
            </button>
          ) : (
            <Link to={`/product/${product.slug}`} className="btn-secondary px-3 py-2 text-xs">
              Подробнее
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
