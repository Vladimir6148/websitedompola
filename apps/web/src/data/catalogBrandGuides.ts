/** Curated brand → collection chips under category titles (catalog listing). */

export type GuideCollection = {
  /** Button label */
  name: string;
  /** Stable id used in ?collection= */
  id: string;
  /** Actual product brand slug(s) for API filter */
  brand: string | string[];
  /** Actual product collection slug(s); omit to filter by brand only */
  collection?: string | string[];
  /** Optional name search (when collection slug is missing/wrong in data) */
  q?: string;
  /** Exclude products whose name contains this string */
  qExclude?: string;
};

export type GuideBrand = {
  name: string;
  slug: string;
  collections: GuideCollection[];
};

export const CATEGORY_BRAND_GUIDES: Record<string, GuideBrand[]> = {
  laminate: [
    {
      name: 'Pergo',
      slug: 'pergo',
      collections: [
        { name: 'Skara Pro', id: 'skara-pro', brand: 'skara', collection: 'skara-pro' },
        { name: 'Skara 12 Pro', id: 'skara-12-pro', brand: 'skara', collection: 'skara' },
        { name: 'Uppsala Pro', id: 'uppsala-pro', brand: 'uppsala', collection: 'uppsala-pro' },
        { name: 'Stavanger', id: 'stavanger', brand: 'stavanger', collection: 'stavanger-pro' },
        { name: 'Chevron Pro', id: 'chevron-pro', brand: 'chevron', collection: 'chevron' },
        { name: 'Goeteborg pro', id: 'goteborg-pro', brand: 'pergo', q: 'Goteborg' },
        { name: 'Elements Pro', id: 'elements-pro', brand: 'elements', collection: 'elements' },
        { name: 'Malmo pro', id: 'malmo-pro', brand: 'malmo', collection: 'malmo-pro' },
        {
          name: 'Chevron 12 pro',
          id: 'chevron-12-pro',
          brand: 'chevron',
          collection: 'chevron',
          q: '12',
        },
        { name: 'Ebeltoft 12 pro', id: 'ebeltoft-12-pro', brand: 'ebeltoft', collection: 'ebeltoft' },
        { name: 'Kalmar', id: 'kalmar', brand: 'kalmar' },
      ],
    },
    {
      name: 'Norland',
      slug: 'norland',
      collections: [
        { name: 'Elegant', id: 'elegant', brand: 'elegant', collection: 'elegant-norland' },
        {
          name: 'Elegant Strong',
          id: 'elegant-strong',
          brand: 'elegant',
          collection: 'elegant-strong',
        },
        {
          name: 'Herringbone Elegant',
          id: 'herringbone-elegant',
          brand: 'herringbone',
          collection: 'herringbone-elegant',
          qExclude: 'Strong',
        },
        {
          name: 'Herringbone Elegant Strong',
          id: 'herringbone-elegant-strong',
          brand: 'herringbone',
          collection: 'herringbone-elegant',
          q: 'Strong',
        },
      ],
    },
    {
      name: 'Clix Floor',
      slug: 'clix-floor',
      collections: [
        { name: 'Charm', id: 'charm', brand: 'clix-floor', q: 'Charm' },
        { name: 'Extra', id: 'extra', brand: 'clix', collection: 'clix-plus', q: 'Extra' },
        { name: 'Flame', id: 'flame', brand: 'clix-floor', q: 'Flame' },
        { name: 'Intense', id: 'intense', brand: 'clix-floor', q: 'Intense' },
        { name: 'Plus', id: 'plus', brand: 'clix-floor', q: 'Floor Plus' },
      ],
    },
    {
      name: 'FloorFort',
      slug: 'floorfort',
      collections: [
        { name: 'Oak Heritage', id: 'oak-heritage', brand: 'floorfort', collection: 'floorfort-dub' },
        { name: 'Walnut Tree', id: 'walnut-tree', brand: 'floorfort', collection: 'floorfort-oreh' },
      ],
    },
    {
      name: 'AGT',
      slug: 'agt',
      collections: [
        {
          name: 'Effect Premium',
          id: 'effect-premium',
          brand: 'effect',
          qExclude: 'ELEGANCE',
        },
        {
          name: 'Effect',
          id: 'effect',
          brand: 'effect',
          q: 'ELEGANCE',
        },
      ],
    },
    {
      name: 'Ideal',
      slug: 'ideal',
      collections: [
        { name: 'Choice', id: 'choice', brand: 'choice', collection: 'choice' },
        { name: 'Form', id: 'form', brand: 'form', collection: 'form' },
        { name: 'Look', id: 'look', brand: 'look', collection: 'look' },
        { name: 'Touch', id: 'touch', brand: 'touch', collection: 'touch' },
      ],
    },
  ],
};

function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Map curated guide URL params to real API brand/collection/q filters. */
export function resolveGuideFilters(
  categorySlug: string | undefined,
  brand: string,
  collection: string,
  q: string,
): { brand: string; collection: string; q: string; qExclude: string } {
  if (!categorySlug) return { brand, collection, q, qExclude: '' };
  const guides = CATEGORY_BRAND_GUIDES[categorySlug];
  if (!guides?.length) return { brand, collection, q, qExclude: '' };

  const brandSlugs = brand
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const guideBrand = guides.find((g) => brandSlugs.includes(g.slug));
  if (!guideBrand) return { brand, collection, q, qExclude: '' };

  const collectionSlugs = collection
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (collectionSlugs.length === 1) {
    const col = guideBrand.collections.find(
      (c) => c.id === collectionSlugs[0] || asList(c.collection).includes(collectionSlugs[0]!),
    );
    if (col) {
      return {
        brand: asList(col.brand).join(','),
        collection: asList(col.collection).join(','),
        q: col.q || '',
        qExclude: col.qExclude || '',
      };
    }
  }

  const brands = new Set<string>();
  for (const c of guideBrand.collections) {
    for (const b of asList(c.brand)) brands.add(b);
  }
  return { brand: [...brands].join(','), collection: '', q: '', qExclude: '' };
}
