import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { LeadForm } from '../components/LeadForm';
import { SmartImage } from '../components/SmartImage';
import { formatPrice } from '../lib/api';
import { useCart } from '../store/cart';

export function CartPage() {
  const { items, setQty, remove, total, clear } = useCart();

  return (
    <>
      <Seo title="Корзина" path="/cart" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Корзина</h1>
        {!items.length ? (
          <div className="mt-8 rounded-2xl border border-dashed border-graphite/15 p-10 text-center">
            <p className="text-graphite/60">Корзина пуста</p>
            <Link to="/catalog" className="btn-primary mt-4 inline-flex">В каталог</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex flex-col gap-4 rounded-2xl border border-graphite/8 p-4 sm:flex-row">
                  <Link to={`/product/${item.slug}`} className="h-28 w-full overflow-hidden rounded-xl bg-mist sm:w-36">
                    <SmartImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link to={`/product/${item.slug}`} className="font-semibold hover:text-brand">{item.name}</Link>
                    <div className="text-sm text-graphite/50">{formatPrice(item.price)} / {item.unit}</div>
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => setQty(item.productId, Number(e.target.value) || 1)}
                        className="w-20 rounded-md border border-graphite/15 px-2 py-1"
                      />
                      <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
                      <button type="button" onClick={() => remove(item.productId)} className="ml-auto text-sm text-red-600">
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <aside className="h-fit rounded-2xl bg-mist p-6">
              <div className="flex justify-between text-lg font-semibold">
                <span>Итого</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="mt-2 text-sm text-graphite/60">Онлайн-оплата будет подключена позже. Сейчас — заявка менеджеру.</p>
              <div className="mt-4">
                <LeadForm
                  source="cart"
                  productName={items.map((i) => `${i.name} × ${i.quantity}`).join('; ')}
                  compact
                />
              </div>
              <button type="button" onClick={clear} className="mt-3 text-sm text-graphite/50 hover:text-graphite">
                Очистить корзину
              </button>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
