import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto bg-graphite text-white">
      <div className="container-dp grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-2xl font-bold text-white">ДОМПОЛА</div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            Напольные покрытия с характером. Шоурумы в Архангельске, Северодвинске и Вологде.
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
            <Link to="/works" className="hover:text-brand">Наши работы</Link>
            <Link to="/stores" className="hover:text-brand">Магазины</Link>
            <Link to="/picker" className="hover:text-brand">Подбор покрытия</Link>
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Контакты</div>
          <div className="grid gap-2 text-sm text-white/80">
            <a href="tel:+78182650000" className="hover:text-brand">+7 (8182) 65-00-00</a>
            <a href="mailto:hello@dompola.ru" className="hover:text-brand">hello@dompola.ru</a>
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
