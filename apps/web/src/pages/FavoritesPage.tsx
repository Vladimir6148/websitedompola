import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { formatPrice } from '../lib/api';
import { useFavorites } from '../store/favorites';

export function FavoritesPage() {
  const { items, remove } = useFavorites();

  return (
    <>
      <Seo title="Избранное" path="/favorites" />
      <div className="container-dp py-10 md:py-14">
        <h1 className="section-title">Избранное</h1>
        {!items.length ? (
          <div className="mt-8 rounded-2xl border border-dashed border-graphite/15 p-10 text-center">
            <p className="text-graphite/60">Пока пусто</p>
            <Link to="/catalog" className="btn-primary mt-4 inline-flex">Выбрать товары</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <article key={item.productId} className="overflow-hidden rounded-2xl border border-graphite/8">
                <Link to={`/product/${item.slug}`} className="block aspect-[4/3] bg-mist">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </Link>
                <div className="p-4">
                  <Link to={`/product/${item.slug}`} className="font-semibold hover:text-brand">{item.name}</Link>
                  <div className="mt-2 font-bold">{formatPrice(item.price)}</div>
                  <button type="button" onClick={() => remove(item.productId)} className="mt-3 text-sm text-red-600">
                    Убрать
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
