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

function withBuildBust(url: string) {
  const bust = import.meta.env.VITE_BUILD_ID;
  if (!bust || bust === 'dev' || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(String(bust))}`;
}

export function resolveImageUrl(url?: string | null, fallback = 'images/floor1.webp') {
  if (!url) return withBuildBust(assetUrl(fallback));

  const localFromAbsolute = toLocalPath(url);
  if (localFromAbsolute) return withBuildBust(assetUrl(preferWebp(localFromAbsolute)));

  if (url.startsWith('images/') || url.startsWith('/images/')) {
    return withBuildBust(assetUrl(preferWebp(url.replace(/^\//, ''))));
  }

  // Legacy Unsplash placeholders → local fallbacks
  if (url.includes('images.unsplash.com') || url.includes('unsplash.com')) {
    return withBuildBust(assetUrl(fallback));
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  if (url.startsWith(import.meta.env.BASE_URL) || url.startsWith('/websitedompola/')) {
    return withBuildBust(url);
  }

  return withBuildBust(assetUrl(preferWebp(url)));
}

/** Local catalog assets are optimized to WebP; keep old .jpg/.png refs working. */
function preferWebp(path: string) {
  return path.replace(/\.(jpe?g|png)$/i, '.webp');
}
