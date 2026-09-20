import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, primaryImage } from '../lib/api';
import { useCart } from '../store/cart';
import { useFavorites } from '../store/favorites';
import { SmartImage } from './SmartImage';

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { toggle, has } = useFavorites();
  const image = primaryImage(product);
  const liked = has(product.id);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-graphite/8 bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,92,40,0.12)]">
      <Link to={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-mist">
        <SmartImage
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {product.discountPercent ? (
          <span className="absolute left-3 top-3 rounded-md bg-brand px-2 py-1 text-xs font-bold text-white">
            −{product.discountPercent}%
          </span>
        ) : null}
        <button
          type="button"
          aria-label="В избранное"
          onClick={(e) => {
            e.preventDefault();
            toggle(product);
          }}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-graphite shadow-sm transition hover:text-brand"
        >
          <Heart className={liked ? 'fill-brand text-brand' : ''} size={18} />
        </button>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="text-xs uppercase tracking-wide text-graphite/50">
          {product.brand?.name}
          {product.collection ? ` · ${product.collection.name}` : ''}
        </div>
        <Link to={`/product/${product.slug}`} className="line-clamp-2 font-semibold leading-snug hover:text-brand">
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-graphite">{formatPrice(product.price)}</div>
            {product.oldPrice ? (
              <div className="text-sm text-graphite/40 line-through">{formatPrice(product.oldPrice)}</div>
            ) : null}
            <div className="text-xs text-graphite/50">за {product.unit}</div>
          </div>
          <button
            type="button"
            className="btn-primary px-3 py-2"
            onClick={() => add(product)}
            aria-label="В корзину"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
