/** Client-side helpers for collection price CSV tables. */

export type CollectionPriceRow = {
  brand: string;
  brand_slug: string;
  collection: string;
  collection_slug: string;
  match_q: string;
  length_mm: number | null;
  width_mm: number | null;
  pack_qty: number | null;
  pack_area: number | null;
  price_per_m2: number;
  products_count: number;
  unit: string;
};

export const CSV_HEADERS = [
  'brand',
  'brand_slug',
  'collection',
  'collection_slug',
  'match_q',
  'length_mm',
  'width_mm',
  'pack_qty',
  'pack_area',
  'price_per_m2',
  'products_count',
  'unit',
] as const;

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ';') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function rowsToCsv(rows: CollectionPriceRow[]): string {
  const lines = [CSV_HEADERS.join(';')];
  for (const r of rows) {
    lines.push(
      [
        r.brand,
        r.brand_slug,
        r.collection,
        r.collection_slug,
        r.match_q || '',
        r.length_mm ?? '',
        r.width_mm ?? '',
        r.pack_qty ?? '',
        r.pack_area ?? '',
        r.price_per_m2 ?? '',
        r.products_count ?? '',
        r.unit || 'м²',
      ]
        .map(escapeCsv)
        .join(';'),
    );
  }
  return `${lines.join('\n')}\n`;
}

export function parseCsv(text: string): CollectionPriceRow[] {
  const raw = String(text || '')
    .replace(/^\uFEFF/, '')
    .trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const rows: CollectionPriceRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? '';
    });
    rows.push({
      brand: obj.brand || '',
      brand_slug: obj.brand_slug || '',
      collection: obj.collection || '',
      collection_slug: obj.collection_slug || '',
      match_q: obj.match_q || '',
      length_mm: numOrNull(obj.length_mm),
      width_mm: numOrNull(obj.width_mm),
      pack_qty: numOrNull(obj.pack_qty),
      pack_area: numOrNull(obj.pack_area),
      price_per_m2: numOrNull(obj.price_per_m2) ?? 0,
      products_count: numOrNull(obj.products_count) ?? 0,
      unit: obj.unit || 'м²',
    });
  }
  return rows;
}

type ProductLike = {
  name: string;
  price: number;
  unit?: string | null;
  packArea?: number | null;
  packQty?: number | null;
  length?: number | null;
  width?: number | null;
  brand?: { slug?: string; name?: string } | null;
  collection?: { slug?: string; name?: string } | null;
  category?: { slug?: string } | null;
};

function groupKey(p: ProductLike): string {
  if (p.collection?.slug) return `c:${p.collection.slug}`;
  const brand = p.brand?.slug || 'unknown';
  const name = String(p.name || '')
    .replace(/^Ламинат\s+/i, '')
    .trim();
  const m = name.match(/^([A-Za-zА-Яа-яЁё0-9]+(?:\s+\d+)?(?:\s+pro)?)/i);
  const label = (m?.[1] || name.split(/\s+/).slice(0, 2).join(' ')).trim();
  return `n:${brand}:${label.toLowerCase()}`;
}

function mostCommon(nums: number[]): number | null {
  if (!nums.length) return null;
  const map = new Map<number, number>();
  for (const n of nums) map.set(n, (map.get(n) || 0) + 1);
  let best = nums[0]!;
  let bestC = 0;
  for (const [n, c] of map) {
    if (c > bestC) {
      best = n;
      bestC = c;
    }
  }
  return best;
}

export function aggregateCollectionRows(
  products: ProductLike[],
  categorySlug?: string,
): CollectionPriceRow[] {
  const filtered = categorySlug
    ? products.filter((p) => p.category?.slug === categorySlug)
    : products;

  type Group = {
    products: ProductLike[];
    brand: string;
    brand_slug: string;
    collection: string;
    collection_slug: string;
    match_q: string;
  };
  const groups = new Map<string, Group>();

  for (const p of filtered) {
    const key = groupKey(p);
    let g = groups.get(key);
    if (!g) {
      const hasCollection = Boolean(p.collection?.slug);
      const name = String(p.name || '')
        .replace(/^Ламинат\s+/i, '')
        .trim();
      const m = name.match(/^([A-Za-zА-Яа-яЁё0-9]+(?:\s+\d+)?(?:\s+pro)?)/i);
      const fallbackLabel = (m?.[1] || name.split(/\s+/).slice(0, 2).join(' ')).trim();
      g = {
        products: [],
        brand: p.brand?.name || '',
        brand_slug: p.brand?.slug || '',
        collection: hasCollection ? p.collection?.name || '' : fallbackLabel,
        collection_slug: hasCollection ? p.collection?.slug || '' : '',
        match_q: hasCollection ? '' : fallbackLabel,
      };
      groups.set(key, g);
    }
    g.products.push(p);
  }

  const rows: CollectionPriceRow[] = [];
  for (const g of groups.values()) {
    const sample = g.products[0]!;
    const prices = g.products.map((p) => Number(p.price) || 0).filter((n) => n > 0);
    const modePrice = mostCommon(prices) ?? sample.price ?? 0;
    rows.push({
      brand: g.brand,
      brand_slug: g.brand_slug,
      collection: g.collection,
      collection_slug: g.collection_slug,
      match_q: g.match_q,
      length_mm: numOrNull(sample.length),
      width_mm: numOrNull(sample.width),
      pack_qty: numOrNull(sample.packQty),
      pack_area: numOrNull(sample.packArea),
      price_per_m2: modePrice,
      products_count: g.products.length,
      unit: sample.unit || 'м²',
    });
  }

  rows.sort((a, b) => {
    const br = a.brand.localeCompare(b.brand, 'ru');
    if (br) return br;
    return a.collection.localeCompare(b.collection, 'ru');
  });
  return rows;
}

export function packPriceFromRow(row: CollectionPriceRow): number | null {
  if (!row.price_per_m2 || !row.pack_area) return null;
  return Math.round(row.price_per_m2 * row.pack_area * 100) / 100;
}
