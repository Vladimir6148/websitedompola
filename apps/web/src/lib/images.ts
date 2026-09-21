/** Resolve image URLs for local + GitHub Pages (/websitedompola/). */
export function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\//, '')}`;
}

/** Prefer same-origin assets over absolute github.io / CDN URLs. */
function toLocalPath(url: string): string | null {
  try {
    if (url.includes('/websitedompola/images/') || (url.includes('vladimir6148.github.io') && url.includes('/images/'))) {
      const idx = url.indexOf('/images/');
      return url.slice(idx + 1); // images/...
    }
  } catch {
    return null;
  }
  return null;
}

export function resolveImageUrl(url?: string | null, fallback = 'images/floor1.webp') {
  if (!url) return assetUrl(fallback);

  const localFromAbsolute = toLocalPath(url);
  if (localFromAbsolute) return assetUrl(preferWebp(localFromAbsolute));

  if (url.startsWith('images/') || url.startsWith('/images/')) {
    return assetUrl(preferWebp(url.replace(/^\//, '')));
  }

  // Legacy Unsplash placeholders → local fallbacks
  if (url.includes('images.unsplash.com') || url.includes('unsplash.com')) {
    return assetUrl(fallback);
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  if (url.startsWith(import.meta.env.BASE_URL) || url.startsWith('/websitedompola/')) {
    return url;
  }

  return assetUrl(preferWebp(url));
}

/** Local catalog assets are optimized to WebP; keep old .jpg/.png refs working. */
function preferWebp(path: string) {
  return path.replace(/\.(jpe?g|png)$/i, '.webp');
}
