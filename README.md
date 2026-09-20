# ДОМПОЛА

Интернет-магазин напольных покрытий для Архангельска, Северодвинска и Вологды.

## Стек

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Lucide
- **Backend:** Node.js, Express, Prisma, JWT, Zod, Multer
- **БД:** SQLite для локальной разработки (легко переключается на PostgreSQL)

## Быстрый старт

```bash
npm run setup
npm run dev
```

- Витрина: http://localhost:5173
- API: http://localhost:4000
- Админка: http://localhost:5173/admin

### Учётные записи

- Админ: `admin@dompola.ru` / `admin123`
- Менеджер: `manager@dompola.ru` / `manager123`

## PostgreSQL

В `apps/api/prisma/schema.prisma` замените:

```prisma
provider = "sqlite"
```

на:

```prisma
provider = "postgresql"
```

и укажите `DATABASE_URL` в `apps/api/.env` (см. `.env.example`).

## Архитектура

```
apps/
  api/     # REST API, Prisma, загрузки изображений
  web/     # витрина + админ-панель
```

Готово к подключению 1С, CRM, оплаты, доставки и внешнего хранилища файлов (S3/R2) через `ProductImage.storageKey` и модуль upload.
