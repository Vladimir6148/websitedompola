import { Link, useLocation } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { LeadForm } from '../components/LeadForm';
import { SmartImage } from '../components/SmartImage';
import { formatPrice } from '../lib/api';
import { formatPackArea, formatUnit, isPackPriced, lineTotal, packsToArea } from '../lib/packaging';
import { rememberCurrentScroll, useReturnLinkState } from '../hooks/useReturnLinkState';
import { useCart } from '../store/cart';

export function CartPage() {
  const { items, setQty, remove, total, clear } = useCart();
  const location = useLocation();
  const returnState = useReturnLinkState();
  const remember = () => rememberCurrentScroll(location.pathname, location.search);

  return (
    <>
      <Seo title="Корзина" path="/cart" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Корзина</h1>
        {!items.length ? (
          <div className="mt-8 rounded-2xl border border-dashed border-graphite/15 p-10 text-center">
            <p className="text-graphite/60">Корзина пуста</p>
            <Link to="/catalog" className="btn-primary mt-4 inline-flex">
              В каталог
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => {
                const dims = {
                  price: item.price,
                  unit: item.unit,
                  packArea: item.packArea,
                  packQty: item.packQty,
                  length: item.length,
                  width: item.width,
                };
                const area =
                  item.soldByPack && item.packArea ? packsToArea(item.quantity, dims) : null;
                const line = lineTotal(item.quantity, dims);
                const showM2PackPrice = item.soldByPack && item.packArea && !isPackPriced(dims);

                return (
                  <div
                    key={item.productId}
                    className="flex flex-col gap-4 rounded-2xl border border-graphite/8 p-4 sm:flex-row"
                  >
                    <Link
                      to={`/product/${item.slug}`}
                      state={returnState}
                      onClick={remember}
                      className="h-28 w-full overflow-hidden rounded-xl bg-mist sm:w-36"
                    >
                      <SmartImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <Link
                        to={`/product/${item.slug}`}
                        state={returnState}
                        onClick={remember}
                        className="font-semibold hover:text-brand"
                      >
                        {item.name}
                      </Link>
                      <div className="text-sm text-graphite/50">
                        {formatPrice(item.price)} / {formatUnit(item.unit, { short: true })}
                        {showM2PackPrice
                          ? ` · ${formatPrice(item.price * item.packArea!)} / ${formatUnit(item.unit, { short: true })}`
                          : null}
                      </div>
                      {area != null ? (
                        <div className="mt-1 text-sm text-graphite/60">
                          {formatPackArea(area)} м² · {item.quantity}{' '}
                          {formatUnit(item.unit, { short: true })}
                        </div>
                      ) : null}
                      <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-md border border-graphite/15 text-lg font-medium"
                            onClick={() => setQty(item.productId, item.quantity - 1)}
                            aria-label="Меньше"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => setQty(item.productId, Number(e.target.value) || 1)}
                            className="w-16 rounded-md border border-graphite/15 px-2 py-1.5 text-center text-sm"
                          />
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-md border border-graphite/15 text-lg font-medium"
                            onClick={() => setQty(item.productId, item.quantity + 1)}
                            aria-label="Больше"
                          >
                            +
                          </button>
                          <span className="text-sm text-graphite/50">
                            {item.soldByPack ? 'упак' : formatUnit(item.unit)}
                          </span>
                        </div>
                        <div className="font-semibold">{formatPrice(line)}</div>
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          className="ml-auto text-sm text-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <aside className="h-fit rounded-2xl bg-mist p-6">
              <div className="flex justify-between text-lg font-semibold">
                <span>Итого</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="mt-2 text-sm text-graphite/60">
                Онлайн-оплата будет подключена позже. Сейчас — заявка менеджеру.
              </p>
              <div className="mt-4">
                <LeadForm
                  source="cart"
                  productName={items
                    .map((i) => {
                      const area =
                        i.soldByPack && i.packArea
                          ? ` (${formatPackArea(packsToArea(i.quantity, { price: i.price, packArea: i.packArea }))} м²)`
                          : '';
                      return `${i.name} × ${i.quantity}${i.soldByPack ? ' упак' : ''}${area}`;
                    })
                    .join('; ')}
                  compact
                  submitLabel="Оформить заказ"
                />
              </div>
              <button
                type="button"
                onClick={clear}
                className="mt-3 text-sm text-graphite/50 hover:text-graphite"
              >
                Очистить корзину
              </button>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
