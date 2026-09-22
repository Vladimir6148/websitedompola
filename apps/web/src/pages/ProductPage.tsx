import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Calculator, ShoppingBag } from 'lucide-react';
import { QtyStepper } from '../components/QtyStepper';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { api, formatPrice, hasPrice, primaryImage, stockLabel } from '../lib/api';
import {
  areaToPacks,
  canRoomCalculate,
  formatBoardSize,
  formatPackArea,
  formatUnit,
  isPackPriced,
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
  const [searchParams] = useSearchParams();
  const packsFromUrl = Math.max(0, Number(searchParams.get('packs') || searchParams.get('qty') || 0));
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [packs, setPacks] = useState(1);
  const [roomArea, setRoomArea] = useState(20);
  const [showRoomCalc, setShowRoomCalc] = useState(false);
  const { add } = useCart();
  const { city } = useCity();

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setLoadError(false);
    api<Product>(`/api/products/slug/${slug}`)
      .then((p) => {
        setProduct(p);
        setActiveImage(0);
        const initial = Math.max(1, Math.round(Number(new URLSearchParams(window.location.search).get('packs')) || 1));
        setPacks(initial);
        if (p.category?.slug) {
          api<ProductsResponse>(`/api/products?category=${p.category.slug}&limit=4`).then((res) => {
            setRelated(res.items.filter((i) => i.id !== p.id).slice(0, 4));
          });
        }
      })
      .catch(() => {
        setProduct(null);
        setLoadError(true);
      });
  }, [slug]);

  useEffect(() => {
    if (packsFromUrl > 0) setPacks(packsFromUrl);
  }, [packsFromUrl, slug]);

  const byPack = product ? isPackSold(product) : false;
  const packArea = product ? resolvePackArea(product) : null;
  const pPack = product ? packPrice(product) : null;
  const board = product ? formatBoardSize(product) : null;
  const roomReady = product ? canRoomCalculate(product) : false;
  const selectedArea = product && roomReady ? packsToArea(packs, product) : packs;
  const cartSum = product ? lineTotal(packs, product) : 0;

  const roomCalc = useMemo(() => {
    if (!product || !roomReady || !packArea) {
      return { packs: 1, area: 0, cost: 0 };
    }
    const withReserve = roomArea * 1.07;
    const needPacks = areaToPacks(withReserve, product);
    const area = packsToArea(needPacks, product);
    return { packs: needPacks, area, cost: lineTotal(needPacks, product) };
  }, [roomArea, product, roomReady, packArea]);

  if (loadError) {
    return (
      <div className="container-dp py-20 text-center">
        <p className="text-graphite/70">Товар не найден или временно недоступен.</p>
        <Link to="/catalog" className="btn-primary mt-6 inline-flex">
          В каталог
        </Link>
      </div>
    );
  }

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
                  <span className="text-lg font-semibold">/{formatUnit(product.unit, { short: true })}</span>
                ) : (
                  <span className="ml-2 text-base font-semibold text-graphite/50">цену уточняйте</span>
                )}
              </div>
              {hasPrice(product.price) && byPack && pPack != null && !isPackPriced(product) ? (
                <div className="mt-1 text-lg font-bold text-graphite">
                  {formatPrice(pPack)}/{formatUnit(product.unit, { short: true })}
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl bg-mist px-4 py-3 text-sm">
              <div className="font-semibold">{stock ? stockLabel(stock.status) : 'Уточняйте наличие'}</div>
              <div className="text-graphite/60">
                {city?.name || 'Город не выбран'}
                {stock?.quantity ? ` · ${stock.quantity} ${byPack ? 'упак' : formatUnit(product.unit)}` : ''}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.stocks.map((s) => (
                  <span key={s.cityId} className="rounded-full bg-white px-3 py-1 text-xs">
                    {s.city?.name}: {stockLabel(s.status)}
                  </span>
                ))}
              </div>
            </div>

            {hasPrice(product.price) ? (
              <div className="mt-6 rounded-2xl border border-graphite/10 bg-white p-5">
                <h2 className="font-display text-xl font-semibold">Заказать онлайн</h2>
                {byPack && roomReady && packArea ? (
                  <>
                    <p className="mt-1 text-sm text-graphite/55">Площадь:</p>
                    <div className="mt-3 flex items-end gap-2">
                      <div className="flex min-w-0 flex-1 items-end gap-2">
                        <QtyStepper
                          label="упак"
                          value={packs}
                          min={1}
                          step={1}
                          onChange={(n) => setPacks(Math.max(1, Math.round(n)))}
                        />
                        <span className="mb-3 shrink-0 text-base font-semibold text-graphite/35">=</span>
                        <QtyStepper
                          label="м²"
                          value={selectedArea}
                          min={packArea}
                          step={packArea}
                          displayValue={Number(selectedArea.toFixed(2))}
                          onChange={(n) => setPacksFromArea(n)}
                        />
                      </div>
                      <button
                        type="button"
                        aria-label="Калькулятор площади"
                        onClick={() => setShowRoomCalc((v) => !v)}
                        className={`mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md border transition ${
                          showRoomCalc
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-graphite/15 bg-mist text-graphite/70 hover:border-brand hover:text-brand'
                        }`}
                      >
                        <Calculator size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  </>
                ) : byPack ? (
                  <>
                    <p className="mt-1 text-sm text-graphite/55">Количество:</p>
                    <div className="mt-3 max-w-xs">
                      <QtyStepper
                        label="упак"
                        value={packs}
                        min={1}
                        step={1}
                        onChange={(n) => setPacks(Math.max(1, Math.round(n)))}
                      />
                    </div>
                    {!packArea ? (
                      <p className="mt-2 text-xs text-graphite/45">
                        Площадь упаковки не указана — пересчёт м² недоступен.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-graphite/55">Количество:</p>
                    <div className="mt-3 max-w-xs">
                      <QtyStepper
                        label={formatUnit(product.unit, { short: true })}
                        value={packs}
                        min={0.1}
                        step={0.1}
                        displayValue={Number(packs.toFixed(1))}
                        onChange={(n) => setPacks(Math.max(0.1, n))}
                      />
                    </div>
                  </>
                )}

                {byPack && roomReady && showRoomCalc ? (
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
                      Нужно {roomCalc.packs} упак · {formatPackArea(roomCalc.area)} м² ·{' '}
                      {formatPrice(roomCalc.cost)}
                    </p>
                  </form>
                ) : null}

                <button
                  type="button"
                  className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-graphite active:scale-[0.98]"
                  onClick={() => add(product, packs)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ShoppingBag size={14} strokeWidth={1.75} className="text-[#d5ddd6]" /> В корзину
                  </span>
                  <span>{formatPrice(cartSum)}</span>
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
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
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
