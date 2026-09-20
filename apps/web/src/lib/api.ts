const API_BASE = import.meta.env.VITE_API_URL || '';
const USE_STATIC =
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
  return `${base}data/${file}`;
}

async function loadJson<T>(file: string): Promise<T> {
  const res = await fetch(dataUrl(file));
  if (!res.ok) throw new ApiError(res.status, `Не удалось загрузить ${file}`);
  return res.json() as Promise<T>;
}

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  published?: boolean;
  featured?: boolean;
  category?: { slug?: string; id?: string; name?: string };
  brand?: { slug?: string; id?: string; name?: string };
  color?: string | null;
  wearClass?: string | null;
  thickness?: number | null;
  moistureResistant?: boolean;
  underfloorHeating?: boolean;
  description?: string | null;
  [key: string]: unknown;
};

async function staticApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(path, 'http://local.api');
  const pathname = url.pathname;

  if (method === 'POST' && pathname === '/api/leads') {
    return { ok: true, id: `static-${Date.now()}` } as T;
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
  if (pathname === '/api/stores') return loadJson('stores.json');
  if (pathname === '/api/promotions') return loadJson('promotions.json');

  if (pathname.startsWith('/api/products/slug/')) {
    const slug = pathname.replace('/api/products/slug/', '');
    const products = await loadJson<Product[]>('products.json');
    const item = products.find((p) => p.slug === slug);
    if (!item) throw new ApiError(404, 'Товар не найден');
    return item as T;
  }

  if (pathname === '/api/products') {
    const products = await loadJson<Product[]>('products.json');
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const category = url.searchParams.get('category') || '';
    const brand = url.searchParams.get('brand') || '';
    const sort = url.searchParams.get('sort') || 'newest';
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(48, Math.max(1, Number(url.searchParams.get('limit') || 12)));
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
    if (category) {
      const slugs = category.split(',').map((s) => s.trim()).filter(Boolean);
      items = items.filter(
        (p) =>
          slugs.includes(p.category?.slug || '') ||
          slugs.includes(p.category?.id || ''),
      );
    }
    if (brand) {
      items = items.filter((p) => p.brand?.slug === brand || p.brand?.id === brand);
    }
    if (minPrice) items = items.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) items = items.filter((p) => p.price <= Number(maxPrice));
    if (wearClass) items = items.filter((p) => p.wearClass === wearClass);
    if (moistureResistant) items = items.filter((p) => p.moistureResistant);
    if (underfloorHeating) items = items.filter((p) => p.underfloorHeating);

    if (sort === 'price_asc') items.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') items.sort((a, b) => b.price - a.price);
    if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

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

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (USE_STATIC) {
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

export function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function stockLabel(status: string) {
  if (status === 'IN_STOCK') return 'В наличии';
  if (status === 'ON_ORDER') return 'Под заказ';
  return 'Нет в наличии';
}

export function primaryImage(product: { images?: { url: string; isPrimary?: boolean }[] }) {
  if (!product.images?.length) {
    return 'images/floor1.jpg';
  }
  return product.images.find((i) => i.isPrimary)?.url || product.images[0].url;
}
