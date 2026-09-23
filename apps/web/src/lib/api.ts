const API_BASE = import.meta.env.VITE_API_URL || '';
export const USE_STATIC =
  import.meta.env.VITE_STATIC_API === 'true' ||
  (!API_BASE && import.meta.env.PROD && import.meta.env.VITE_STATIC_API !== 'false');

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
  if (pathname === '/api/content/home') return loadJson('home.json');
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
    const slug = pathname.replace('/api/products/slug/', '');
    const products = await loadJson<Product[]>('products.json');
    const item = products.find((p) => p.slug === slug);
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
    if (!extra) {
      return {
        ...item,
        characteristics: (item.characteristics as Detail['characteristics']) || [],
        images: (item.images as Detail['images']) || [],
        stocks: (item.stocks as unknown[]) || [],
      } as T;
    }
    const baseImages = (item.images as Detail['images']) || [];
    const moreImages = extra.images || [];
    return {
      ...item,
      description: extra.description ?? item.description,
      characteristics:
        extra.characteristics ??
        (item.characteristics as Detail['characteristics']) ??
        [],
      seoTitle: extra.seoTitle ?? item.seoTitle,
      seoDescription: extra.seoDescription ?? item.seoDescription,
      images: [...baseImages, ...moreImages],
      stocks: (item.stocks as unknown[]) || [],
    } as T;
  }

  if (pathname === '/api/products') {
    const products = await loadJson<Product[]>('products.json');
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const qExclude = (url.searchParams.get('qExclude') || '').trim().toLowerCase();
    const category = url.searchParams.get('category') || '';
    const brand = url.searchParams.get('brand') || '';
    const collection = url.searchParams.get('collection') || '';
    const sort = url.searchParams.get('sort') || 'newest';
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(2000, Math.max(1, Number(url.searchParams.get('limit') || 12)));
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const wearClass = url.searchParams.get('wearClass') || '';
    const moistureResistant = url.searchParams.get('moistureResistant') === '1';
    const underfloorHeating = url.searchParams.get('underfloorHeating') === '1';
    const featured = url.searchParams.get('featured') === '1';

    let items = [...products];
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
  if (!API_BASE) return false;
  if (method !== 'GET') return true;
  const pathname = new URL(path, 'http://local.api').pathname;
  if (pathname.startsWith('/api/auth')) return true;
  // Admin reads need the live API (not present in static JSON)
  if (pathname === '/api/leads' || pathname.startsWith('/api/leads/')) return true;
  if (pathname.startsWith('/api/products/id/')) return true;
  if (pathname === '/api/products' && new URL(path, 'http://local.api').searchParams.get('published') === 'all') {
    return true;
  }
  return false;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  // Public catalog reads use static JSON when enabled (full ODS import on Pages).
  // Auth and mutations still go to Render when VITE_API_URL is set.
  if (USE_STATIC && !wantsLiveApi(path, method)) {
    return staticApi<T>(path, options);
  }

  if (!API_BASE) {
    return staticApi<T>(path, options);
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error || 'Ошибка запроса');
  }
  return data as T;
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
    return 'images/floor1.webp';
  }
  const preferred = product.images.find((i) => i.isPrimary) || product.images[0];
  const local = product.images.find(
    (i) => i.url.startsWith('images/') || i.url.startsWith('/images/'),
  );
  // Prefer same-origin asset when present; caller can pass remote as SmartImage fallback.
  return (local || preferred).url;
}

/** Extra URL to try when the primary (often local) asset is missing or hangs. */
export function fallbackImage(product: { images?: { url: string; isPrimary?: boolean }[] }) {
  const remote = product.images?.find(
    (i) =>
      /^https?:\/\//i.test(i.url) &&
      !i.url.includes('unsplash.com') &&
      !i.url.includes('images.unsplash.com'),
  );
  return remote?.url || 'images/floor1.webp';
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
