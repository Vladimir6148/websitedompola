import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calculator, ShoppingCart } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { api, formatPrice, hasPrice, primaryImage, stockLabel } from '../lib/api';
import {
  areaToPacks,
  formatBoardSize,
  formatPackArea,
  isPackSold,
  lineTotal,
  packPrice,
  packsToArea,
  resolvePackArea,
} from '../lib/packaging';
import type { Product, ProductsResponse } from '../types';
import { useCart } from '../store/cart';
import { useCity } from '../store/city';

export function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [packs, setPacks] = useState(1);
  const [roomArea, setRoomArea] = useState(20);
  const [showRoomCalc, setShowRoomCalc] = useState(false);
  const { add } = useCart();
  const { city } = useCity();

  useEffect(() => {
    if (!slug) return;
    api<Product>(`/api/products/slug/${slug}`).then((p) => {
      setProduct(p);
      setActiveImage(0);
      setPacks(1);
      if (p.category?.slug) {
        api<ProductsResponse>(`/api/products?category=${p.category.slug}&limit=4`).then((res) => {
          setRelated(res.items.filter((i) => i.id !== p.id).slice(0, 4));
        });
      }
    });
  }, [slug]);

  const byPack = product ? isPackSold(product) : false;
  const packArea = product ? resolvePackArea(product) : null;
  const pPack = product ? packPrice(product) : null;
  const board = product ? formatBoardSize(product) : null;
  const selectedArea = product && byPack ? packsToArea(packs, product) : packs;
  const cartSum = product ? lineTotal(packs, product) : 0;

  const roomCalc = useMemo(() => {
    if (!product || !byPack || !packArea) {
      return { packs: Math.ceil(roomArea), area: roomArea, cost: product ? product.price * roomArea : 0 };
    }
    const withReserve = roomArea * 1.07;
    const needPacks = areaToPacks(withReserve, product);
    const area = packsToArea(needPacks, product);
    return { packs: needPacks, area, cost: lineTotal(needPacks, product) };
  }, [roomArea, product, byPack, packArea]);

  if (!product) {
    return <div className="container-dp py-20 text-graphite/60">Загрузка товара…</div>;
  }

  const stock = product.stocks.find((s) => s.cityId === city?.id) || product.stocks[0];
  const images = product.images.length ? product.images : [{ url: primaryImage(product), alt: product.name }];
  const discount =
    product.discountPercent ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);

  function setPacksFromArea(m2: number) {
    if (!product) return;
    setPacks(areaToPacks(m2, product));
  }

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
          <Link to="/" className="hover:text-brand">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link to="/catalog" className="hover:text-brand">
            Каталог
          </Link>
          {product.category ? (
            <>
              <span className="mx-2">/</span>
              <Link to={`/catalog/${product.category.slug}`} className="hover:text-brand">
                {product.category.name}
              </Link>
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
                  <SmartImage
                    src={img.url}
                    alt={img.alt || `${product.name} фото ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
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

            {(board || product.packQty || packArea) ? (
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-graphite/65">
                {board ? (
                  <span className="rounded-md bg-mist px-2.5 py-1">Доска {board}</span>
                ) : null}
                {product.packQty ? (
                  <span className="rounded-md bg-mist px-2.5 py-1">{product.packQty} шт. в упаковке</span>
                ) : null}
                {packArea ? (
                  <span className="rounded-md bg-mist px-2.5 py-1">{formatPackArea(packArea)} м² / упак</span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2">
                {hasPrice(product.price) && discount ? (
                  <span className="rounded-full bg-[#e11d48] px-2.5 py-1 text-xs font-bold text-white">
                    −{discount}%
                  </span>
                ) : null}
                {hasPrice(product.price) && product.oldPrice ? (
                  <span className="text-base text-graphite/40 line-through">{formatPrice(product.oldPrice)}</span>
                ) : null}
              </div>
              <div className={`mt-1 text-3xl font-bold md:text-4xl ${hasPrice(product.price) ? 'text-[#e11d48]' : 'text-graphite'}`}>
                {formatPrice(product.price)}
                {hasPrice(product.price) ? (
                  <span className="text-lg font-semibold">/{product.unit}</span>
                ) : (
                  <span className="ml-2 text-base font-semibold text-graphite/50">цену уточняйте</span>
                )}
              </div>
              {hasPrice(product.price) && byPack && pPack != null ? (
                <div className="mt-1 text-lg font-bold text-graphite">{formatPrice(pPack)}/упак</div>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl bg-mist px-4 py-3 text-sm">
              <div className="font-semibold">{stock ? stockLabel(stock.status) : 'Уточняйте наличие'}</div>
              <div className="text-graphite/60">
                {city?.name || 'Город не выбран'}
                {stock?.quantity ? ` · ${stock.quantity} ${byPack ? 'уп.' : product.unit}` : ''}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.stocks.map((s) => (
                  <span key={s.cityId} className="rounded-full bg-white px-3 py-1 text-xs">
                    {s.city?.name}: {stockLabel(s.status)}
                  </span>
                ))}
              </div>
            </div>

            {byPack && packArea && hasPrice(product.price) ? (
              <div className="mt-6 rounded-2xl border border-graphite/10 bg-white p-5">
                <h2 className="font-display text-xl font-semibold">Заказать онлайн</h2>
                <p className="mt-1 text-sm text-graphite/55">Площадь:</p>
                <div className="mt-3 flex items-stretch gap-2">
                  <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-graphite/15">
                    <label className="flex flex-1 items-center gap-1 px-3 py-3">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={packs}
                        onChange={(e) => setPacks(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                        className="w-full min-w-0 border-0 bg-transparent text-sm font-semibold outline-none"
                      />
                      <span className="shrink-0 text-sm text-graphite/50">уп.</span>
                    </label>
                    <span className="px-1 text-graphite/30">=</span>
                    <label className="flex flex-1 items-center gap-1 px-3 py-3">
                      <input
                        type="number"
                        min={packArea}
                        step={0.1}
                        value={Number(selectedArea.toFixed(2))}
                        onChange={(e) => setPacksFromArea(Number(e.target.value) || packArea)}
                        className="w-full min-w-0 border-0 bg-transparent text-sm font-semibold outline-none"
                      />
                      <span className="shrink-0 text-sm text-graphite/50">м²</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    aria-label="Калькулятор площади"
                    onClick={() => setShowRoomCalc((v) => !v)}
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition ${
                      showRoomCalc
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-graphite/15 bg-mist text-graphite/70 hover:border-brand hover:text-brand'
                    }`}
                  >
                    <Calculator size={18} strokeWidth={1.75} />
                  </button>
                </div>

                {showRoomCalc ? (
                  <form
                    className="mt-4 rounded-xl bg-mist p-4"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      setPacks(roomCalc.packs);
                      setShowRoomCalc(false);
                    }}
                  >
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-graphite/50">
                      Площадь помещения, м²
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        min={1}
                        value={roomArea}
                        onChange={(e) => setRoomArea(Number(e.target.value) || 1)}
                        className="w-28 rounded-md border border-graphite/15 px-3 py-2 text-sm"
                      />
                      <button type="submit" className="btn-secondary py-2 text-sm">
                        Применить (+7%)
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-graphite/55">
                      Нужно {roomCalc.packs} уп. · {formatPackArea(roomCalc.area)} м² ·{' '}
                      {formatPrice(roomCalc.cost)}
                    </p>
                  </form>
                ) : null}

                <button
                  type="button"
                  className="btn-primary mt-4 w-full justify-between px-5"
                  onClick={() => add(product, packs)}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart size={16} /> В корзину
                  </span>
                  <span>{formatPrice(cartSum)}</span>
                </button>
              </div>
            ) : hasPrice(product.price) ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={() => add(product, 1)}>
                  <ShoppingCart size={16} /> В корзину
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-graphite/10 bg-mist p-5">
                <p className="text-sm text-graphite/70">
                  Цену уточняйте у менеджера — наличие и актуальная стоимость зависят от склада.
                </p>
                <a href="tel:+79214994979" className="btn-primary mt-4 inline-flex">
                  Позвонить
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Описание</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-graphite/70">{product.description}</p>
          <h3 className="mt-8 font-display text-xl font-semibold">Характеристики</h3>
          <dl className="mt-3 max-w-3xl divide-y divide-graphite/8 border-y border-graphite/8">
              {[
                product.thickness ? ['Толщина', `${product.thickness} мм`] : null,
                product.length ? ['Длина доски', `${product.length} мм`] : null,
                product.width ? ['Ширина доски', `${product.width} мм`] : null,
                product.packQty ? ['Штук в упаковке', String(product.packQty)] : null,
                packArea ? ['Площадь упаковки', `${formatPackArea(packArea)} м²`] : null,
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
