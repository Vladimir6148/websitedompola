import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { resolveImageUrl } from '../lib/images';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
  fallback?: string;
  /** Prefer for above-the-fold cards (eager + high priority). */
  priority?: boolean;
};

/**
 * Resolves catalog image URLs. Falls back only when the browser reports a real
 * load error — never on a timer (that swapped every slow mobile card to floor1).
 */
export function SmartImage({
  src,
  fallback = 'images/floor1.webp',
  alt = '',
  className,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);

  const resolved = failed
    ? resolveImageUrl(fallback, 'images/floor1.webp')
    : resolveImageUrl(src, fallback);
  const loading = rest.loading ?? (priority ? 'eager' : 'lazy');
  const isRemote = /^https?:\/\//i.test(resolved);
  const fallbackResolved = resolveImageUrl(fallback, 'images/floor1.webp');
  const canFallback = !failed && resolved !== fallbackResolved;

  useEffect(() => {
    setFailed(false);
  }, [src, fallback]);

  return (
    <img
      {...rest}
      src={resolved}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={loading}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority || loading === 'eager' ? 'high' : rest.fetchPriority}
      referrerPolicy={isRemote ? undefined : 'no-referrer'}
      onLoad={rest.onLoad}
      onError={(e) => {
        if (canFallback) setFailed(true);
        rest.onError?.(e);
      }}
    />
  );
}
