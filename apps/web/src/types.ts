export type Role = 'ADMIN' | 'MANAGER';
export type StockStatus = 'IN_STOCK' | 'ON_ORDER' | 'OUT_OF_STOCK';

export type City = { id: string; name: string; slug: string; active: boolean };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
  active: boolean;
  filterSchema?: string | null;
  _count?: { products: number };
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  sortOrder: number;
  active: boolean;
};

export type ProductImage = {
  id?: string;
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
  storageKey?: string | null;
};

export type ProductCharacteristic = {
  id?: string;
  key: string;
  label: string;
  value: string;
  sortOrder?: number;
};

export type Stock = {
  id?: string;
  cityId: string;
  status: StockStatus;
  quantity: number;
  city?: City;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  discountPercent?: number | null;
  unit: string;
  packQty?: number | null;
  packArea?: number | null;
  thickness?: number | null;
  wearClass?: string | null;
  length?: number | null;
  width?: number | null;
  color?: string | null;
  bevel?: string | null;
  lockType?: string | null;
  moistureResistant: boolean;
  underfloorHeating: boolean;
  wearLayer?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published: boolean;
  featured: boolean;
  categoryId: string;
  brandId: string;
  collectionId?: string | null;
  category?: Category;
  brand?: Brand;
  collection?: { id: string; name: string; slug: string } | null;
  images: ProductImage[];
  characteristics: ProductCharacteristic[];
  stocks: Stock[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type Store = {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  schedule?: string | null;
  description?: string | null;
  photos?: string | null;
  lat?: number | null;
  lng?: number | null;
  active: boolean;
  cityId: string;
  city?: City;
};

export type Promotion = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  discountPercent?: number | null;
  active: boolean;
  sortOrder?: number;
  categoryId?: string | null;
};

export type Service = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
};

export type Work = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  city?: string | null;
  category?: string | null;
};

export type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
};

export type Advantage = {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
};

export type ContactInfo = { id: string; key: string; label: string; value: string };

export type HomePayload = {
  banners: Banner[];
  advantages: Advantage[];
  services: Service[];
  works: Work[];
  contacts: ContactInfo[];
  categories: Category[];
  featured: Product[];
  /** Homepage offers — baked so we never load products.json on `/` */
  deals?: Product[];
  /** Underlayment / baseboards / glue teaser */
  related?: Product[];
  promotions: Promotion[];
  stores: Store[];
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  comment?: string | null;
  source?: string | null;
  status: string;
  createdAt: string;
  city?: City | null;
};
