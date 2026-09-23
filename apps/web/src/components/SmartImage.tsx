import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { resolveImageUrl } from '../lib/images';

/** Only for images that are actually fetching; lazy off-screen must not trip this. */
const LOAD_TIMEOUT_MS = 20000;

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
  const loadedRef = useRef(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [watchLoad, setWatchLoad] = useState(false);

  const resolved = failed
    ? resolveImageUrl(fallback, 'images/floor1.webp')
    : resolveImageUrl(src, fallback);
  const loading = rest.loading ?? (priority ? 'eager' : 'lazy');
  const isRemote = /^https?:\/\//i.test(resolved);
  const fallbackResolved = resolveImageUrl(fallback, 'images/floor1.webp');
  const canFallback = !failed && resolved !== fallbackResolved;

  // Only reset when the intended source changes — not when we switch to fallback.
  useEffect(() => {
    loadedRef.current = false;
    setFailed(false);
    // Eager images start fetching immediately; lazy wait until near viewport.
    setWatchLoad(loading !== 'lazy');
  }, [src, fallback, loading]);

  // Start the hung-request timer only once the browser is allowed to fetch
  // (eager mount, or lazy image intersecting / already complete).
  useEffect(() => {
    if (loading !== 'lazy') return;
    const node = imgRef.current;
    if (!node) return;

    if (node.complete && node.naturalWidth > 0) {
      loadedRef.current = true;
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setWatchLoad(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setWatchLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [resolved, loading, failed]);

  useEffect(() => {
    if (!canFallback || !watchLoad) return;
    const id = window.setTimeout(() => {
      if (!loadedRef.current) setFailed(true);
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [resolved, canFallback, watchLoad]);

  return (
    <img
      {...rest}
      ref={(node) => {
        imgRef.current = node;
        if (node?.complete && node.naturalWidth > 0) {
          loadedRef.current = true;
        }
      }}
      src={resolved}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={loading}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority || loading === 'eager' ? 'high' : rest.fetchPriority}
      referrerPolicy={isRemote ? undefined : 'no-referrer'}
      onLoad={(e) => {
        loadedRef.current = true;
        rest.onLoad?.(e);
      }}
      onError={(e) => {
        if (canFallback) setFailed(true);
        rest.onError?.(e);
      }}
    />
  );
}
