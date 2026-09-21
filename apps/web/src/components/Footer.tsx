import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';

export function Footer() {
  return (
    <footer className="mt-auto bg-graphite text-white">
      <div className="container-dp grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandMark size="lg" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            Розничная сеть магазинов напольных покрытий
          </p>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Каталог</div>
          <div className="grid gap-2 text-sm text-white/80">
            <Link to="/catalog/quartzvinyl-spc" className="hover:text-brand">Кварцвинил / SPC</Link>
            <Link to="/catalog/laminate" className="hover:text-brand">Ламинат</Link>
            <Link to="/catalog/linoleum" className="hover:text-brand">Линолеум</Link>
            <Link to="/catalog/porcelain" className="hover:text-brand">Керамогранит</Link>
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Компания</div>
          <div className="grid gap-2 text-sm text-white/80">
            <Link to="/services" className="hover:text-brand">Услуги</Link>
            <Link to="/stores" className="hover:text-brand">Магазины</Link>
            <Link to="/contacts" className="hover:text-brand">Контакты</Link>
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Контакты</div>
          <div className="grid gap-2 text-sm text-white/80">
            <a href="tel:+79214994979" className="hover:text-brand">+7 (921) 499-49-79</a>
            <a href="mailto:dompola29@mail.ru" className="hover:text-brand">dompola29@mail.ru</a>
            <p>Пн–Сб 10:00–20:00</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-dp flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} ДОМПОЛА</span>
          <Link to="/admin" className="hover:text-white">Вход для сотрудников</Link>
        </div>
      </div>
    </footer>
  );
}
