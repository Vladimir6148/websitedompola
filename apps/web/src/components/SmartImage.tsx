import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { assetUrl, resolveImageUrl } from '../lib/images';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
  fallback?: string;
  /** Prefer for above-the-fold cards (eager + high priority). */
  priority?: boolean;
};

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
  const [loaded, setLoaded] = useState(false);
  const resolved = failed ? assetUrl(fallback) : resolveImageUrl(src, fallback);
  const loading = rest.loading ?? (priority ? 'eager' : 'lazy');
  const isRemote = /^https?:\/\//i.test(resolved);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src, resolved]);

  return (
    <img
      {...rest}
      key={resolved}
      src={resolved}
      alt={alt}
      className={`${className || ''} ${loaded ? 'opacity-100' : 'opacity-0'}`.trim()}
      sizes={sizes}
      loading={loading}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority || loading === 'eager' ? 'high' : rest.fetchPriority}
      referrerPolicy={isRemote ? undefined : 'no-referrer'}
      ref={(el) => {
        // Cached images often skip onLoad if it fired before React attached the handler.
        if (el && el.complete && el.naturalWidth > 0) {
          setLoaded(true);
        }
      }}
      onLoad={(e) => {
        setLoaded(true);
        rest.onLoad?.(e);
      }}
      onError={(e) => {
        if (!failed) {
          setFailed(true);
          setLoaded(false);
        } else {
          setLoaded(true);
        }
        rest.onError?.(e);
      }}
    />
  );
}
