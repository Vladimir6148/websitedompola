import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../../web/public/data');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const productInclude = {
    category: true,
    brand: true,
    collection: true,
    images: { orderBy: { sortOrder: 'asc' as const } },
    characteristics: { orderBy: { sortOrder: 'asc' as const } },
    stocks: { include: { city: true } },
  };

  const [
    products,
    categories,
    brands,
    cities,
    stores,
    promotions,
    services,
    works,
    banners,
    advantages,
    contacts,
    featured,
  ] = await Promise.all([
    prisma.product.findMany({ where: { published: true }, include: productInclude, orderBy: { createdAt: 'desc' } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.city.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    prisma.store.findMany({ where: { active: true }, include: { city: true }, orderBy: { name: 'asc' } }),
    prisma.promotion.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.work.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.advantage.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.contactInfo.findMany({ where: { active: true } }),
    prisma.product.findMany({
      where: { published: true, featured: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        brand: true,
        category: true,
      },
      take: 8,
    }),
  ]);

  const home = {
    banners,
    advantages,
    services,
    works,
    contacts,
    categories,
    featured,
    promotions,
    stores,
  };

  const files: Record<string, unknown> = {
    'products.json': products,
    'categories.json': categories,
    'brands.json': brands,
    'cities.json': cities,
    'stores.json': stores,
    'promotions.json': promotions,
    'services.json': services,
    'works.json': works,
    'home.json': home,
  };

  for (const [name, data] of Object.entries(files)) {
    fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), 'utf8');
    console.log('wrote', name, Array.isArray(data) ? data.length : 'object');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
