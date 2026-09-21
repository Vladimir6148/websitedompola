import { useState, type ImgHTMLAttributes } from 'react';
import { assetUrl, resolveImageUrl } from '../lib/images';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
  fallback?: string;
};

export function SmartImage({
  src,
  fallback = 'images/floor1.webp',
  alt = '',
  className,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? assetUrl(fallback) : resolveImageUrl(src, fallback);
  const loading = rest.loading ?? 'lazy';

  return (
    <img
      {...rest}
      src={resolved}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={loading}
      decoding="async"
      fetchPriority={loading === 'eager' ? 'high' : rest.fetchPriority}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
