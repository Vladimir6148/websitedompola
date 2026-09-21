/** Resolve image URLs for local + GitHub Pages (/websitedompola/). */
export function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\//, '')}`;
}

const UNSPLASH_TO_LOCAL: Record<string, string> = {
  'photo-1615874959474-d609969a20ed': 'images/hero.webp',
  'photo-1600210492486-724fe5c67fb0': 'images/living.webp',
  'photo-1616486338812-3dadae4b4ace': 'images/wood.webp',
  'photo-1581858726788-75bc0f6a952d': 'images/floor1.webp',
  'photo-1560185007-cde436f6a4d0': 'images/floor2.webp',
  'photo-1556909114-f6e7ad7d3136': 'images/floor3.webp',
  'photo-1441986300917-64674bd600d8': 'images/store.webp',
  'photo-1503387762-592deb58ef4e': 'images/work.webp',
  'photo-1618221195710-dd6b41faaea6': 'images/promo.webp',
};

/** Prefer same-origin assets over absolute github.io / CDN URLs. */
function toLocalPath(url: string): string | null {
  try {
    if (url.includes('/websitedompola/images/')) {
      const idx = url.indexOf('/images/');
      return url.slice(idx + 1); // images/...
    }
    if (url.includes('vladimir6148.github.io') && url.includes('/images/')) {
      const idx = url.indexOf('/images/');
      return url.slice(idx + 1);
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

  if (url.includes('images.unsplash.com') || url.includes('unsplash.com')) {
    for (const [key, local] of Object.entries(UNSPLASH_TO_LOCAL)) {
      if (url.includes(key)) return assetUrl(preferWebp(local));
    }
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
