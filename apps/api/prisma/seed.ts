import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const IMG = {
  hero: 'https://vladimir6148.github.io/websitedompola/images/hero.jpg',
  living: 'https://vladimir6148.github.io/websitedompola/images/living.jpg',
  wood: 'https://vladimir6148.github.io/websitedompola/images/wood.jpg',
  floor1: 'https://vladimir6148.github.io/websitedompola/images/floor1.jpg',
  floor2: 'https://vladimir6148.github.io/websitedompola/images/floor2.jpg',
  floor3: 'https://vladimir6148.github.io/websitedompola/images/floor3.jpg',
  store: 'https://vladimir6148.github.io/websitedompola/images/store.jpg',
  work: 'https://vladimir6148.github.io/websitedompola/images/work.jpg',
  promo: 'https://vladimir6148.github.io/websitedompola/images/promo.jpg',
};

async function main() {
  console.log('Seeding ДОМПОЛА...');

  await prisma.stock.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCharacteristic.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.store.deleteMany();
  await prisma.service.deleteMany();
  await prisma.work.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.advantage.deleteMany();
  await prisma.contactInfo.deleteMany();
  await prisma.characteristicDefinition.deleteMany();
  await prisma.siteContent.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@dompola.ru',
      passwordHash,
      name: 'Администратор',
      role: 'ADMIN',
    },
  });
  await prisma.user.create({
    data: {
      email: 'manager@dompola.ru',
      passwordHash: await bcrypt.hash('manager123', 10),
      name: 'Менеджер',
      role: 'MANAGER',
    },
  });

  const cities = await Promise.all(
    [
      { name: 'Архангельск', slug: 'arkhangelsk' },
      { name: 'Северодвинск', slug: 'severodvinsk' },
      { name: 'Вологда', slug: 'vologda' },
    ].map((c) => prisma.city.create({ data: c })),
  );

  const categoryData = [
    {
      name: 'Кварцвинил / SPC',
      slug: 'quartzvinyl-spc',
      description: 'Влагостойкие жёсткие покрытия для дома и коммерции',
      image: IMG.floor1,
      filterSchema: JSON.stringify([
        'brand', 'collection', 'price', 'thickness', 'wearLayer', 'wearClass',
        'moistureResistant', 'underfloorHeating', 'lockType',
      ]),
    },
    {
      name: 'Ламинат',
      slug: 'laminate',
      description: 'Практичные и выразительные решения для жилых интерьеров',
      image: IMG.wood,
      filterSchema: JSON.stringify([
        'brand', 'collection', 'price', 'wearClass', 'thickness', 'color',
        'bevel', 'moistureResistant', 'underfloorHeating',
      ]),
    },
    {
      name: 'Линолеум',
      slug: 'linoleum',
      description: 'Комфортные рулонные покрытия с большим выбором дизайнов',
      image: IMG.floor2,
      filterSchema: JSON.stringify(['brand', 'collection', 'price', 'thickness', 'color', 'wearClass']),
    },
    {
      name: 'Керамогранит',
      slug: 'porcelain',
      description: 'Прочный и стильный выбор для кухни, санузла и коммерции',
      image: IMG.floor3,
      filterSchema: JSON.stringify(['brand', 'collection', 'price', 'thickness', 'color', 'length', 'width']),
    },
    {
      name: 'Паркет',
      slug: 'parquet',
      description: 'Натуральное дерево с характером и теплом',
      image: IMG.living,
      filterSchema: JSON.stringify(['brand', 'collection', 'price', 'thickness', 'color', 'underfloorHeating']),
    },
    {
      name: 'Плинтусы',
      slug: 'baseboards',
      description: 'Завершающий штрих для любого покрытия',
      image: IMG.wood,
      filterSchema: JSON.stringify(['brand', 'price', 'color', 'height']),
    },
    {
      name: 'Подложка',
      slug: 'underlayment',
      description: 'Основа для тишины, тепла и ровного пола',
      image: IMG.floor1,
      filterSchema: JSON.stringify(['brand', 'price', 'thickness']),
    },
    {
      name: 'Комплектующие',
      slug: 'accessories',
      description: 'Пороги, профили и всё для аккуратного монтажа',
      image: IMG.floor2,
      filterSchema: JSON.stringify(['brand', 'price', 'color']),
    },
  ];

  const categories = [];
  for (let i = 0; i < categoryData.length; i++) {
    categories.push(
      await prisma.category.create({ data: { ...categoryData[i], sortOrder: i + 1 } }),
    );
  }

  const brands = await Promise.all(
    [
      { name: 'Alpine Floor', slug: 'alpine-floor', website: 'https://alpinefloor.ru', description: 'SPC и кварцвинил' },
      { name: 'Quick-Step', slug: 'quick-step', website: 'https://www.quick-step.ru', description: 'Ламинат и винил' },
      { name: 'Tarkett', slug: 'tarkett', website: 'https://www.tarkett.ru', description: 'Линолеум и ламинат' },
      { name: 'Kerama Marazzi', slug: 'kerama-marazzi', description: 'Керамогранит' },
      { name: 'Barlinek', slug: 'barlinek', description: 'Паркетная доска' },
    ].map((b, i) => prisma.brand.create({ data: { ...b, sortOrder: i + 1 } })),
  );

  const alpine = brands[0];
  const quick = brands[1];
  const tarkett = brands[2];
  const kerama = brands[3];
  const barlinek = brands[4];

  const colNordic = await prisma.collection.create({
    data: { name: 'Nordic', slug: 'nordic', brandId: alpine.id },
  });
  const colClassic = await prisma.collection.create({
    data: { name: 'Classic', slug: 'classic', brandId: quick.id },
  });

  const defs = [
    { key: 'wearClass', label: 'Класс износостойкости', type: 'text', sortOrder: 1 },
    { key: 'thickness', label: 'Толщина', type: 'number', unit: 'мм', sortOrder: 2 },
    { key: 'wearLayer', label: 'Защитный слой', type: 'text', sortOrder: 3 },
    { key: 'lockType', label: 'Тип замка', type: 'text', sortOrder: 4 },
    { key: 'bevel', label: 'Фаска', type: 'text', sortOrder: 5 },
    { key: 'color', label: 'Цвет', type: 'text', sortOrder: 6 },
  ];
  for (const d of defs) {
    await prisma.characteristicDefinition.create({ data: d });
  }

  const productsSeed = [
    {
      name: 'Alpine Floor Дуб Нордик',
      slug: 'alpine-floor-dub-nordic',
      sku: 'AF-ND-01',
      price: 1890,
      oldPrice: 2290,
      categoryId: categories[0].id,
      brandId: alpine.id,
      collectionId: colNordic.id,
      thickness: 5,
      wearClass: '43',
      color: 'светлый дуб',
      lockType: 'Click',
      moistureResistant: true,
      underfloorHeating: true,
      wearLayer: '0.5 мм',
      packArea: 2.23,
      unit: 'м²',
      featured: true,
      description: 'Жёсткий SPC с натуральным рисунком дуба. Подходит для кухни, прихожей и тёплого пола.',
      image: IMG.floor1,
    },
    {
      name: 'Quick-Step Дуб Классик',
      slug: 'quick-step-dub-classic',
      sku: 'QS-CL-12',
      price: 1450,
      oldPrice: 1690,
      categoryId: categories[1].id,
      brandId: quick.id,
      collectionId: colClassic.id,
      thickness: 8,
      wearClass: '32',
      color: 'натуральный дуб',
      bevel: '4V',
      moistureResistant: true,
      underfloorHeating: true,
      packArea: 1.72,
      unit: 'м²',
      featured: true,
      description: 'Ламинат с выразительной фактурой дерева и устойчивостью к повседневной нагрузке.',
      image: IMG.wood,
    },
    {
      name: 'Tarkett Idylle Дуб',
      slug: 'tarkett-idylle-dub',
      sku: 'TR-ID-08',
      price: 790,
      categoryId: categories[2].id,
      brandId: tarkett.id,
      thickness: 3.2,
      wearClass: '33',
      color: 'дуб светлый',
      moistureResistant: true,
      unit: 'м²',
      featured: true,
      description: 'Мягкий и тёплый линолеум для спален и детских.',
      image: IMG.floor2,
    },
    {
      name: 'Kerama Marazzi Вуд Эффект',
      slug: 'kerama-marazzi-wood-effect',
      sku: 'KM-WE-60',
      price: 2100,
      categoryId: categories[3].id,
      brandId: kerama.id,
      thickness: 9,
      length: 600,
      width: 150,
      color: 'тёмный орех',
      unit: 'м²',
      featured: true,
      description: 'Керамогранит под дерево — для зон с высокой влажностью и коммерческих пространств.',
      image: IMG.floor3,
    },
    {
      name: 'Barlinek Дуб Масло',
      slug: 'barlinek-dub-maslo',
      sku: 'BL-DM-01',
      price: 4200,
      oldPrice: 4800,
      categoryId: categories[4].id,
      brandId: barlinek.id,
      thickness: 14,
      color: 'натуральный дуб',
      underfloorHeating: true,
      packArea: 2.77,
      unit: 'м²',
      featured: true,
      description: 'Паркетная доска с масляным покрытием и живой фактурой натурального дуба.',
      image: IMG.living,
    },
    {
      name: 'Плинтус МДФ Белый 80',
      slug: 'plintus-mdf-belyj-80',
      sku: 'PL-80-W',
      price: 320,
      categoryId: categories[5].id,
      brandId: quick.id,
      color: 'белый',
      unit: 'шт',
      description: 'Высокий плинтус для современного интерьера.',
      image: IMG.wood,
    },
  ];

  for (const p of productsSeed) {
    const { image, ...rest } = p;
    const discountPercent =
      rest.oldPrice && rest.oldPrice > rest.price
        ? Math.round(((rest.oldPrice - rest.price) / rest.oldPrice) * 100)
        : null;

    const product = await prisma.product.create({
      data: {
        ...rest,
        discountPercent,
        seoTitle: `${rest.name} — купить в ДОМПОЛА`,
        seoDescription: rest.description,
        images: {
          create: [
            { url: image, alt: rest.name, isPrimary: true, sortOrder: 0 },
            { url: IMG.living, alt: `${rest.name} в интерьере`, sortOrder: 1 },
          ],
        },
        characteristics: {
          create: [
            rest.wearClass
              ? { key: 'wearClass', label: 'Класс', value: rest.wearClass, sortOrder: 0 }
              : null,
            rest.thickness
              ? { key: 'thickness', label: 'Толщина', value: `${rest.thickness} мм`, sortOrder: 1 }
              : null,
            rest.color
              ? { key: 'color', label: 'Цвет', value: rest.color, sortOrder: 2 }
              : null,
          ].filter(Boolean) as { key: string; label: string; value: string; sortOrder: number }[],
        },
        stocks: {
          create: cities.map((city, idx) => ({
            cityId: city.id,
            status: idx === 2 ? 'ON_ORDER' : 'IN_STOCK',
            quantity: idx === 2 ? 0 : 40 + idx * 12,
          })),
        },
      },
    });
    console.log('Product:', product.slug);
  }

  for (const city of cities) {
    await prisma.store.create({
      data: {
        name: `ДОМПОЛА — ${city.name}`,
        address:
          city.slug === 'arkhangelsk'
            ? 'ТЦ «Новосёл», Московский проспект, 25, корп. 4, стр. 1'
            : city.slug === 'severodvinsk'
              ? 'ул. Южная, 4'
              : 'ул. Чернышевского, 97А',
        phone:
          city.slug === 'arkhangelsk'
            ? '+7 (921) 499-49-79'
            : city.slug === 'severodvinsk'
              ? '+7 (921) 249-49-79'
              : '',
        schedule: 'Пн–Сб 10:00–20:00, Вс 10:00–18:00',
        description: 'Шоурум напольных покрытий, консультации и расчёт материалов.',
        photos: JSON.stringify([IMG.store]),
        lat: city.slug === 'arkhangelsk' ? 64.532847 : city.slug === 'severodvinsk' ? 64.5581 : 59.237315,
        lng: city.slug === 'arkhangelsk' ? 40.594182 : city.slug === 'severodvinsk' ? 39.8565 : 39.902258,
        cityId: city.id,
      },
    });
  }

  await prisma.banner.createMany({
    data: [
      {
        title: 'ДомПола — сеть магазинов напольных покрытий',
        subtitle: 'Кварцвинил, ламинат и паркет для Архангельска, Северодвинска и Вологды',
        image: IMG.hero,
        ctaText: 'Смотреть каталог',
        ctaLink: '/catalog',
        sortOrder: 1,
      },
      {
        title: 'Сезон тёплых скидок',
        subtitle: 'До −20% на избранные коллекции SPC и ламината',
        image: IMG.promo,
        ctaText: 'К акциям',
        ctaLink: '/promotions',
        sortOrder: 2,
      },
    ],
  });

  await prisma.advantage.createMany({
    data: [
      { title: 'Шоурумы с живыми образцами', description: 'Живые образцы покрытий и консультация технолога', icon: 'store', sortOrder: 1 },
      { title: 'Подбор под задачу', description: 'Учитываем влажность, нагрузку, тёплый пол и стиль', icon: 'compass', sortOrder: 2 },
      { title: 'Профессиональный монтаж', description: 'Бригады с опытом укладки SPC, ламината и плитки', icon: 'hammer', sortOrder: 3 },
      { title: 'Честный расчёт', description: 'Считаем площадь, запас и комплектующие без сюрпризов', icon: 'calculator', sortOrder: 4 },
    ],
  });

  await prisma.service.createMany({
    data: [
      { title: 'Замер помещения', slug: 'zamer', description: 'Выезд специалиста и точный расчёт материалов', icon: 'ruler', sortOrder: 1 },
      { title: 'Укладка покрытий', slug: 'ukladka', description: 'Монтаж ламината, SPC, линолеума и керамогранита', icon: 'layers', sortOrder: 2 },
      { title: 'Демонтаж старого пола', slug: 'demontazh', description: 'Аккуратно снимем покрытие и подготовим основание', icon: 'trash', sortOrder: 3 },
      { title: 'Подготовка основания', slug: 'podgotovka', description: 'Выравнивание, грунтовка и гидроизоляция', icon: 'grid', sortOrder: 4 },
    ],
  });

  await prisma.work.createMany({
    data: [
      { title: 'SPC в гостиной', slug: 'spc-gostinaya', image: IMG.living, city: 'Архангельск', category: 'Кварцвинил / SPC', sortOrder: 1 },
      { title: 'Ламинат в квартире', slug: 'laminat-kvartira', image: IMG.wood, city: 'Северодвинск', category: 'Ламинат', sortOrder: 2 },
      { title: 'Керамогранит на кухне', slug: 'keramogranit-kuhnya', image: IMG.floor3, city: 'Вологда', category: 'Керамогранит', sortOrder: 3 },
      { title: 'Паркет в кабинете', slug: 'parket-kabinet', image: IMG.work, city: 'Архангельск', category: 'Паркет', sortOrder: 4 },
    ],
  });

  await prisma.promotion.createMany({
    data: [
      {
        title: 'Скидка на Nordic',
        slug: 'skidka-nordic',
        description: 'Специальная цена на коллекцию Alpine Floor Nordic',
        image: IMG.promo,
        discountPercent: 17,
        categoryId: categories[0].id,
        active: true,
        sortOrder: 1,
      },
      {
        title: 'Ламинат со скидкой до 15%',
        slug: 'laminat-skidka-15',
        description: 'Актуальные предложения на популярные коллекции ламината',
        image: IMG.wood,
        discountPercent: 15,
        categoryId: categories[1].id,
        active: true,
        sortOrder: 2,
      },
      {
        title: 'SPC для тёплого пола',
        slug: 'spc-teplyy-pol',
        description: 'Влагостойкий кварцвинил — выгодные комплекты месяца',
        image: IMG.living,
        discountPercent: 10,
        categoryId: categories[0].id,
        active: true,
        sortOrder: 3,
      },
    ],
  });

  await prisma.contactInfo.createMany({
    data: [
      { key: 'phone', label: 'Телефон', value: '+7 (921) 499-49-79' },
      { key: 'email', label: 'Email', value: 'hello@dompola.ru' },
      { key: 'hours', label: 'Режим работы', value: 'Пн–Сб 10:00–20:00' },
    ],
  });

  console.log('Seed complete.');
  console.log('Admin: admin@dompola.ru / admin123');
  console.log('Manager: manager@dompola.ru / manager123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
