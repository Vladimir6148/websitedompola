// Empty = same-origin /api (Reg.ru php proxy). Avoid absolute host (www vs apex breaks).
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const USE_STATIC =
  import.meta.env.VITE_STATIC_API === 'true' ||
  (!API_BASE && import.meta.env.PROD && import.meta.env.VITE_STATIC_API !== 'false');

/** Wake Render via same-origin proxy (call on admin login screen). */
export async function wakeApi(timeoutMs = 60_000): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem('dompola_token');
}

function dataUrl(file: string) {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const bust = import.meta.env.VITE_BUILD_ID || import.meta.env.VITE_STATIC_API || '1';
  return `${base}data/${file}?v=${encodeURIComponent(String(bust))}`;
}

const jsonCache = new Map<string, Promise<unknown>>();

/** Drop cached static JSON (call after admin price edits). */
export function clearStaticDataCache(opts?: { keepPrices?: boolean }) {
  jsonCache.clear();
  if (!opts?.keepPrices) priceMapCache = null;
}

/** Drop only the live price map (e.g. after switching city). */
export function clearPriceMapCache() {
  priceMapCache = null;
}

/** Merge prices into the in-memory live map so the site shows edits immediately. */
export function patchPriceMapCache(updates: Record<string, number>, cityKey?: string) {
  const key = cityKey || priceMapCache?.city || '';
  priceMapCache = {
    at: Date.now(),
    city: key,
    map: { ...(priceMapCache?.city === key ? priceMapCache.map : {}), ...updates },
  };
}

let priceMapCache: { at: number; city: string; map: Record<string, number> } | null = null;

function selectedCityId() {
  try {
    return localStorage.getItem('dompola_city') || '';
  } catch {
    return '';
  }
}

/** Fetch live id→price map (optionally for a city). Fresh after admin edits. */
export async function fetchPriceMap(cityId?: string): Promise<Record<string, number>> {
  const cid = cityId || selectedCityId();
  const params = new URLSearchParams();
  if (cid) params.set('cityId', cid);
  // Bust CDN/browser caches so site picks up admin price changes quickly.
  params.set('t', String(Math.floor(Date.now() / 8_000)));
  const qs = params.toString() ? `?${params}` : '';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(`${API_BASE}/api/products/prices${qs}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    return (await res.json()) as Record<string, number>;
  } catch {
    return {};
  }
}

async function loadLivePriceMap(): Promise<Record<string, number>> {
  const city = selectedCityId();
  // Short TTL — admin price edits appear on the storefront within seconds.
  if (priceMapCache && priceMapCache.city === city && Date.now() - priceMapCache.at < 8_000) {
    return priceMapCache.map;
  }
  const map = await fetchPriceMap(city);
  if (Object.keys(map).length) {
    priceMapCache = { at: Date.now(), city, map };
  }
  return map;
}

function applyPriceMap<T extends { id?: string; price?: number }>(
  items: T[],
  map: Record<string, number>,
): T[] {
  if (!map || !Object.keys(map).length) return items;
  return items.map((p) => {
    const id = p.id;
    if (!id || map[id] == null) return p;
    return { ...p, price: map[id]! };
  });
}

async function loadJson<T>(file: string): Promise<T> {
  let pending = jsonCache.get(file);
  if (!pending) {
    pending = (async () => {
      const res = await fetch(dataUrl(file));
      if (!res.ok) {
        jsonCache.delete(file);
        throw new ApiError(res.status, `Не удалось загрузить ${file}`);
      }
      return res.json();
    })();
    jsonCache.set(file, pending);
  }
  return pending as Promise<T>;
}

type ProductsManifest = Record<string, { file: string; count: number }>;

/** Prefer category shards (~0.1–1MB) over full products.json (~2MB). */
async function loadProductsForQuery(categoryParam: string): Promise<Product[]> {
  const slugs = categoryParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return loadJson<Product[]>('products.json');
  }

  try {
    const manifest = await loadJson<ProductsManifest>('products-manifest.json');
    const parts = await Promise.all(
      slugs.map(async (slug) => {
        const entry = manifest[slug];
        if (!entry?.file) return [] as Product[];
        try {
          return await loadJson<Product[]>(entry.file);
        } catch {
          return [] as Product[];
        }
      }),
    );
    const merged = parts.flat();
    if (merged.length) return merged;
  } catch {
    // fall through to full catalog
  }
  return loadJson<Product[]>('products.json');
}

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  published?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: { slug?: string; id?: string; name?: string };
  brand?: { slug?: string; id?: string; name?: string };
  collection?: { slug?: string; id?: string; name?: string };
  color?: string | null;
  wearClass?: string | null;
  thickness?: number | null;
  moistureResistant?: boolean;
  underfloorHeating?: boolean;
  description?: string | null;
  [key: string]: unknown;
};

type BrandRow = { id: string; slug: string };

async function staticApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(path, 'http://local.api');
  const pathname = url.pathname;

  if (method === 'POST' && pathname === '/api/leads') {
    throw new ApiError(
      503,
      'Онлайн-заявка временно недоступна. Позвоните нам или напишите в мессенджер.',
    );
  }

  if (method === 'POST' && pathname === '/api/picker') {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const products = await loadJson<Product[]>('products.json');
    let items = [...products];
    if (body.heating === 'yes') items = items.filter((p) => p.underfloorHeating);
    if (body.priority === 'moisture' || body.room === 'kitchen' || body.room === 'hallway') {
      items = items.filter((p) => p.moistureResistant);
    }
    if (body.priority === 'price') items.sort((a, b) => a.price - b.price);
    return { items: items.slice(0, 12), criteria: body } as T;
  }

  if (method !== 'GET') {
    throw new ApiError(
      503,
      'На GitHub Pages доступен просмотр каталога. Для админки и сохранения нужен backend (Render/Railway).',
    );
  }

  if (pathname === '/api/health') return { ok: true, service: 'dompola-static' } as T;
  if (pathname === '/api/content/home') {
    const home = await loadJson<{
      featured?: Product[];
      deals?: Product[];
      related?: Product[];
      [key: string]: unknown;
    }>('home.json');
    const priceMap = await loadLivePriceMap();
    return {
      ...home,
      featured: applyPriceMap(home.featured || [], priceMap),
      deals: applyPriceMap(home.deals || [], priceMap),
      related: applyPriceMap(home.related || [], priceMap),
    } as T;
  }
  if (pathname === '/api/content/cities') return loadJson('cities.json');
  if (pathname === '/api/content/services') return loadJson('services.json');
  if (pathname === '/api/content/works') return loadJson('works.json');
  if (pathname === '/api/categories' || pathname.startsWith('/api/categories/')) {
    const categories = await loadJson<Array<{ slug: string }>>('categories.json');
    if (pathname === '/api/categories') return categories as T;
    const slug = pathname.split('/').pop()!;
    const item = categories.find((c) => c.slug === slug);
    if (!item) throw new ApiError(404, 'Категория не найдена');
    return item as T;
  }
  if (pathname === '/api/brands') return loadJson('brands.json');
  if (pathname === '/api/collections') {
    const collections = await loadJson<
      { id: string; name: string; slug: string; brandId: string }[]
    >('collections.json');
    const brandParam = url.searchParams.get('brand');
    if (!brandParam) return collections as T;
    // brand query may be brand id or slug
    const brands = await loadJson<BrandRow[]>('brands.json');
    const brandIds = new Set(
      brands
        .filter((b) => b.id === brandParam || b.slug === brandParam)
        .map((b) => b.id),
    );
    return collections.filter((c) => brandIds.has(c.brandId)) as T;
  }
  if (pathname === '/api/stores') return loadJson('stores.json');
  if (pathname === '/api/promotions') return loadJson('promotions.json');

  if (pathname.startsWith('/api/products/slug/')) {
    const raw = pathname.replace('/api/products/slug/', '');
    let slug = raw;
    try {
      slug = decodeURIComponent(raw);
    } catch {
      slug = raw;
    }
    const products = await loadJson<Product[]>('products.json');
    const item = products.find((p) => p.slug === slug || p.slug === raw);
    if (!item) throw new ApiError(404, 'Товар не найден');
    type Detail = {
      description?: string | null;
      characteristics?: { key: string; label: string; value: string }[];
      images?: { url: string; alt?: string; isPrimary?: boolean }[];
      seoTitle?: string | null;
      seoDescription?: string | null;
    };
    let details: Record<string, Detail> = {};
    try {
      details = await loadJson<Record<string, Detail>>('product-details.json');
    } catch {
      details = {};
    }
    const extra = details[slug];
    const priceMap = await loadLivePriceMap();
    const withPrice = applyPriceMap([item], priceMap)[0]!;
    if (!extra) {
      return {
        ...withPrice,
        characteristics: (withPrice.characteristics as Detail['characteristics']) || [],
        images: (withPrice.images as Detail['images']) || [],
        stocks: (withPrice.stocks as unknown[]) || [],
      } as T;
    }
    const baseImages = (withPrice.images as Detail['images']) || [];
    const moreImages = extra.images || [];
    // If catalog already has a curated local photo (Parser1224 / imports),
    // do not append old multi-decor galleries from product-details.
    const hasCuratedLocal = baseImages.some((i) =>
      /^images\/(alta|alpine|mspc|pergo|floorfort|agt)\//i.test(String(i.url || '')),
    );
    const images = hasCuratedLocal
      ? baseImages
      : [...baseImages, ...moreImages].filter(
          (img, idx, arr) => img?.url && arr.findIndex((x) => x.url === img.url) === idx,
        );
    return {
      ...withPrice,
      description: extra.description ?? withPrice.description,
      characteristics:
        extra.characteristics ??
        (withPrice.characteristics as Detail['characteristics']) ??
        [],
      seoTitle: extra.seoTitle ?? withPrice.seoTitle,
      seoDescription: extra.seoDescription ?? withPrice.seoDescription,
      images,
      stocks: (withPrice.stocks as unknown[]) || [],
    } as T;
  }

  if (pathname === '/api/products') {
    const category = url.searchParams.get('category') || '';
    const products = await loadProductsForQuery(category);
    // Admin can pass livePrices=0 for instant load from Reg.ru shards only.
    const priceMap =
      url.searchParams.get('livePrices') === '0' ? {} : await loadLivePriceMap();
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const qExclude = (url.searchParams.get('qExclude') || '').trim().toLowerCase();
    const brand = url.searchParams.get('brand') || '';
    const collection = url.searchParams.get('collection') || '';
    const sort = url.searchParams.get('sort') || 'newest';
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(5000, Math.max(1, Number(url.searchParams.get('limit') || 12)));
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const wearClass = url.searchParams.get('wearClass') || '';
    const moistureResistant = url.searchParams.get('moistureResistant') === '1';
    const underfloorHeating = url.searchParams.get('underfloorHeating') === '1';
    const featured = url.searchParams.get('featured') === '1';

    let items = applyPriceMap([...products], priceMap);
    if (featured) items = items.filter((p) => p.featured);
    if (q) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q),
      );
    }
    if (qExclude) {
      items = items.filter((p) => !p.name.toLowerCase().includes(qExclude));
    }
    if (category) {
      const slugs = category.split(',').map((s) => s.trim()).filter(Boolean);
      items = items.filter(
        (p) =>
          slugs.includes(p.category?.slug || '') ||
          slugs.includes(p.category?.id || ''),
      );
    }
    if (brand) {
      const slugs = brand.split(',').map((s) => s.trim()).filter(Boolean);
      items = items.filter(
        (p) => slugs.includes(p.brand?.slug || '') || slugs.includes(p.brand?.id || ''),
      );
    }
    if (collection) {
      const slugs = collection.split(',').map((s) => s.trim()).filter(Boolean);
      items = items.filter(
        (p) =>
          slugs.includes(p.collection?.slug || '') || slugs.includes(p.collection?.id || ''),
      );
    }
    if (minPrice) items = items.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) items = items.filter((p) => hasPrice(p.price) && p.price <= Number(maxPrice));
    if (wearClass) {
      const wanted = wearClass
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      items = items.filter((p) => {
        const raw = (p.wearClass || '').trim();
        if (!raw) return false;
        return wanted.some((w) => raw === w || raw.split(/[,;/|\s]+/).includes(w));
      });
    }
    if (moistureResistant) items = items.filter((p) => p.moistureResistant);
    if (underfloorHeating) items = items.filter((p) => p.underfloorHeating);

    if (sort === 'price_asc') {
      items.sort((a, b) => {
        const ap = a.price > 0 ? a.price : Number.POSITIVE_INFINITY;
        const bp = b.price > 0 ? b.price : Number.POSITIVE_INFINITY;
        return ap - bp;
      });
    }
    if (sort === 'price_desc') {
      items.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    if (sort === 'popular') {
      items.sort((a, b) => {
        const af = a.featured ? 1 : 0;
        const bf = b.featured ? 1 : 0;
        if (bf !== af) return bf - af;
        return a.name.localeCompare(b.name, 'ru');
      });
    }
    if (sort === 'newest') {
      items.sort((a, b) => {
        const at = Date.parse(String(a.createdAt || a.updatedAt || 0)) || 0;
        const bt = Date.parse(String(b.createdAt || b.updatedAt || 0)) || 0;
        if (bt !== at) return bt - at;
        // Stable fallback when static catalog omits timestamps
        const as = Number(a.sortOrder) || 0;
        const bs = Number(b.sortOrder) || 0;
        if (bs !== as) return bs - as;
        return a.name.localeCompare(b.name, 'ru');
      });
    }

    const total = items.length;
    const start = (page - 1) * limit;
    const pageItems = items.slice(start, start + limit);
    return {
      items: pageItems,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    } as T;
  }

  throw new ApiError(404, `Статический API: маршрут не найден (${pathname})`);
}

function wantsLiveApi(path: string, method: string) {
  // Live routes go to /api (same-origin proxy or VITE_API_URL).
  if (!API_BASE && !(import.meta.env.PROD && USE_STATIC)) return false;
  if (method !== 'GET') return true;
  const pathname = new URL(path, 'http://local.api').pathname;
  if (pathname.startsWith('/api/auth')) return true;
  // Leads / ops live only on the API; catalog reads stay on Reg.ru static JSON (fast).
  if (pathname === '/api/leads' || pathname.startsWith('/api/leads/')) return true;
  if (pathname === '/api/ops' || pathname.startsWith('/api/ops/')) return true;
  if (pathname.startsWith('/api/products/id/')) return true;
  // Live price map is fetched separately inside staticApi with a short timeout.
  if (pathname === '/api/products/prices') return true;
  return false;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function liveFetchOnce(path: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-Dompola-Authorization', `Bearer ${token}`);
  }

  const hasExternalSignal = Boolean(options.signal);
  const ctrl = hasExternalSignal ? null : new AbortController();
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: options.signal || ctrl!.signal,
      cache: 'no-store',
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  // Public catalog reads use static JSON when enabled.
  // Auth/mutations use same-origin /api → Reg.ru proxy → Render.
  if (USE_STATIC && !wantsLiveApi(path, method)) {
    return staticApi<T>(path, options);
  }

  if (!API_BASE && !(import.meta.env.PROD && USE_STATIC) && !wantsLiveApi(path, method)) {
    return staticApi<T>(path, options);
  }

  const pathname = new URL(path, 'http://local.api').pathname;
  const isAuth = pathname.startsWith('/api/auth');
  const timeoutMs = isAuth ? 90_000 : method === 'GET' ? 12_000 : 25_000;
  const retries = isAuth || method !== 'GET' ? 3 : 1;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await liveFetchOnce(path, options, timeoutMs);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Retry upstream wake-ups / proxy blips
        if (attempt < retries && (res.status === 502 || res.status === 503 || res.status === 504)) {
          await sleep(1500 * attempt);
          continue;
        }
        throw new ApiError(res.status, (data as { error?: string }).error || 'Ошибка запроса');
      }
      return data as T;
    } catch (err) {
      lastErr = err;
      if (err instanceof ApiError && err.status !== 502 && err.status !== 503 && err.status !== 504) {
        throw err;
      }
      const transient =
        (err instanceof DOMException && err.name === 'AbortError') ||
        err instanceof TypeError ||
        (err instanceof ApiError && (err.status === 502 || err.status === 503 || err.status === 504));
      if (attempt < retries && transient) {
        await sleep(1500 * attempt);
        continue;
      }
      if (err instanceof ApiError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError(504, 'Сервер ещё запускается — нажмите «Войти» ещё раз');
      }
      if (err instanceof TypeError) {
        throw new ApiError(503, 'Нет связи — нажмите «Войти» ещё раз через пару секунд');
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new ApiError(503, 'Нет связи с API');
}

export function formatPrice(value: number | null | undefined) {
  if (value == null || value <= 0) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function hasPrice(value: number | null | undefined) {
  return value != null && value > 0;
}

export function stockLabel(status: string) {
  if (status === 'IN_STOCK') return 'В наличии';
  if (status === 'ON_ORDER') return 'Под заказ';
  return 'Нет в наличии';
}

export function primaryImage(product: { images?: { url: string; isPrimary?: boolean }[] }) {
  if (!product.images?.length) {
    return 'images/soon.webp';
  }
  const preferred = product.images.find((i) => i.isPrimary) || product.images[0];
  const local = product.images.find(
    (i) => i.url.startsWith('images/') || i.url.startsWith('/images/'),
  );
  // Prefer same-origin asset when present; caller can pass remote as SmartImage fallback.
  const url = (local || preferred).url;
  // Old lifestyle stubs — treat as missing
  if (/images\/floor[12]\.webp$/i.test(url)) return 'images/soon.webp';
  return url;
}

/** Extra URL to try when the primary (often local) asset is missing or hangs. */
export function fallbackImage(product: { images?: { url: string; isPrimary?: boolean }[] }) {
  const remote = product.images?.find(
    (i) =>
      /^https?:\/\//i.test(i.url) &&
      !i.url.includes('unsplash.com') &&
      !i.url.includes('images.unsplash.com'),
  );
  return remote?.url || 'images/soon.webp';
}

/** Decode common HTML entities and collapse markup leftovers for plain-text UI. */
export function formatPlainText(value: string | null | undefined) {
  if (!value) return '';
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
