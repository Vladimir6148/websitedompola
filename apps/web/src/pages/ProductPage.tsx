import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { Seo } from '../components/Seo';
import { LeadForm } from '../components/LeadForm';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { api, formatPrice, primaryImage, stockLabel } from '../lib/api';
import type { Product, ProductsResponse } from '../types';
import { useCart } from '../store/cart';
import { useFavorites } from '../store/favorites';
import { useCity } from '../store/city';

export function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [area, setArea] = useState(20);
  const { add } = useCart();
  const { toggle, has } = useFavorites();
  const { city } = useCity();

  useEffect(() => {
    if (!slug) return;
    api<Product>(`/api/products/slug/${slug}`).then((p) => {
      setProduct(p);
      setActiveImage(0);
      if (p.category?.slug) {
        api<ProductsResponse>(`/api/products?category=${p.category.slug}&limit=4`).then((res) => {
          setRelated(res.items.filter((i) => i.id !== p.id).slice(0, 4));
        });
      }
    });
  }, [slug]);

  const calc = useMemo(() => {
    if (!product?.packArea) {
      return { packs: Math.ceil(area), withReserve: Math.ceil(area * 1.05), cost: product ? product.price * area : 0 };
    }
    const withReserve = area * 1.07;
    const packs = Math.ceil(withReserve / product.packArea);
    const qty = packs * product.packArea;
    return { packs, withReserve: qty, cost: qty * product.price };
  }, [area, product]);

  if (!product) {
    return <div className="container-dp py-20 text-graphite/60">Загрузка товара…</div>;
  }

  const stock = product.stocks.find((s) => s.cityId === city?.id) || product.stocks[0];
  const images = product.images.length ? product.images : [{ url: primaryImage(product), alt: product.name }];

  return (
    <>
      <Seo
        title={product.seoTitle || product.name}
        description={product.seoDescription || product.description || undefined}
        path={`/product/${product.slug}`}
        image={primaryImage(product)}
      />

      <div className="container-dp py-8 md:py-12">
        <nav className="mb-6 text-sm text-graphite/50">
          <Link to="/" className="hover:text-brand">Главная</Link>
          <span className="mx-2">/</span>
          <Link to="/catalog" className="hover:text-brand">Каталог</Link>
          {product.category ? (
            <>
              <span className="mx-2">/</span>
              <Link to={`/catalog/${product.category.slug}`} className="hover:text-brand">{product.category.name}</Link>
            </>
          ) : null}
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
              <SmartImage
                src={images[activeImage]?.url}
                alt={images[activeImage]?.alt || product.name}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square overflow-hidden rounded-lg border ${i === activeImage ? 'border-brand' : 'border-transparent'}`}
                >
                  <SmartImage src={img.url} alt={img.alt || `${product.name} фото ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm uppercase tracking-wide text-graphite/50">
              {product.brand?.name}
              {product.collection ? ` · ${product.collection.name}` : ''}
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-graphite/50">Артикул: {product.sku}</p>

            <div className="mt-5 flex items-end gap-3">
              <div className="text-3xl font-bold">{formatPrice(product.price)}</div>
              {product.oldPrice ? <div className="text-lg text-graphite/40 line-through">{formatPrice(product.oldPrice)}</div> : null}
              {product.discountPercent ? (
                <span className="rounded-md bg-brand px-2 py-1 text-xs font-bold text-white">−{product.discountPercent}%</span>
              ) : null}
            </div>
            <div className="text-sm text-graphite/50">за {product.unit}</div>

            <div className="mt-4 rounded-xl bg-mist px-4 py-3 text-sm">
              <div className="font-semibold">{stock ? stockLabel(stock.status) : 'Уточняйте наличие'}</div>
              <div className="text-graphite/60">
                {city?.name || 'Город не выбран'}
                {stock?.quantity ? ` · ${stock.quantity} ${product.unit}` : ''}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.stocks.map((s) => (
                  <span key={s.cityId} className="rounded-full bg-white px-3 py-1 text-xs">
                    {s.city?.name}: {stockLabel(s.status)}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => add(product)}>
                <ShoppingCart size={16} /> В корзину
              </button>
              <button type="button" className="btn-secondary" onClick={() => toggle(product)}>
                <Heart size={16} className={has(product.id) ? 'fill-brand text-brand' : ''} />
                В избранное
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-graphite/10 p-5">
              <h2 className="font-display text-xl font-semibold">Рассчитать количество</h2>
              <p className="mt-1 text-sm text-graphite/60">Введите площадь помещения — посчитаем упаковки и запас ~7%.</p>
              <form
                className="mt-4 flex flex-wrap items-end gap-3"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  add(product, Math.max(1, calc.packs));
                }}
              >
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wide text-graphite/50">Площадь, м²</label>
                  <input
                    type="number"
                    min={1}
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value) || 1)}
                    className="w-32 rounded-md border border-graphite/15 px-3 py-2"
                  />
                </div>
                <button type="submit" className="btn-primary">Добавить расчёт в корзину</button>
              </form>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-mist p-3">
                  <div className="text-graphite/50">С запасом</div>
                  <div className="font-semibold">{calc.withReserve.toFixed(2)} м²</div>
                </div>
                <div className="rounded-lg bg-mist p-3">
                  <div className="text-graphite/50">Упаковок</div>
                  <div className="font-semibold">{calc.packs}</div>
                </div>
                <div className="rounded-lg bg-mist p-3">
                  <div className="text-graphite/50">Ориентир</div>
                  <div className="font-semibold">{formatPrice(calc.cost)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold">Описание</h2>
            <p className="mt-3 leading-relaxed text-graphite/70">{product.description}</p>
            <h3 className="mt-8 font-display text-xl font-semibold">Характеристики</h3>
            <dl className="mt-3 divide-y divide-graphite/8 border-y border-graphite/8">
              {[
                product.thickness ? ['Толщина', `${product.thickness} мм`] : null,
                product.wearClass ? ['Класс', product.wearClass] : null,
                product.color ? ['Цвет', product.color] : null,
                product.lockType ? ['Замок', product.lockType] : null,
                product.bevel ? ['Фаска', product.bevel] : null,
                product.wearLayer ? ['Защитный слой', product.wearLayer] : null,
                ['Влагостойкость', product.moistureResistant ? 'Да' : 'Нет'],
                ['Тёплый пол', product.underfloorHeating ? 'Да' : 'Нет'],
                ...product.characteristics.map((c) => [c.label, c.value] as [string, string]),
              ]
                .filter(Boolean)
                .map((row) => {
                  const [label, value] = row as [string, string];
                  return (
                    <div key={label} className="grid grid-cols-2 gap-4 py-3 text-sm">
                      <dt className="text-graphite/50">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  );
                })}
            </dl>
          </div>
          <div className="rounded-2xl bg-mist p-6">
            <h2 className="font-display text-2xl font-semibold">Получить консультацию</h2>
            <p className="mt-2 text-sm text-graphite/60">Подскажем по наличию, укладке и комплектующим.</p>
            <div className="mt-4">
              <LeadForm source="product" productName={product.name} compact />
            </div>
          </div>
        </div>

        {related.length ? (
          <section className="mt-16">
            <h2 className="section-title mb-6">Похожие товары</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
