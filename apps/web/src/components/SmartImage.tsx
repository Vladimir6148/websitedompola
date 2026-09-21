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
  }, [src]);

  return (
    <>
      {!loaded ? (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-mist via-[#e8eee6] to-mist"
        />
      ) : null}
      <img
        {...rest}
        src={resolved}
        alt={alt}
        className={`${className || ''} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`.trim()}
        sizes={sizes}
        loading={loading}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority || loading === 'eager' ? 'high' : rest.fetchPriority}
        referrerPolicy={isRemote ? undefined : 'no-referrer'}
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
    </>
  );
}
