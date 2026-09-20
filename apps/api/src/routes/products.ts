import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole, slugify } from '../lib/auth.js';

const router = Router();

const productInclude = {
  category: true,
  brand: true,
  collection: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  characteristics: { orderBy: { sortOrder: 'asc' as const } },
  stocks: { include: { city: true } },
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      q,
      category,
      brand,
      collection,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = '1',
      limit = '12',
      published,
      featured,
      city,
      wearClass,
      thickness,
      color,
      moistureResistant,
      underfloorHeating,
    } = req.query;

    const where: Prisma.ProductWhereInput = {};

    if (published === 'all') {
      // Unpublished products only via authenticated admin clients.
      // Public catalog always sees published items unless explicitly filtered.
      if (!req.headers.authorization) {
        where.published = true;
      }
    } else {
      where.published = published === '0' ? false : true;
    }

    if (featured === '1') where.featured = true;

    if (typeof q === 'string' && q.trim()) {
      where.OR = [
        { name: { contains: q.trim() } },
        { sku: { contains: q.trim() } },
        { description: { contains: q.trim() } },
      ];
    }

    if (typeof category === 'string' && category) {
      const slugs = category.split(',').map((s) => s.trim()).filter(Boolean);
      if (slugs.length > 1) {
        where.category = { slug: { in: slugs } };
      } else {
        where.category = { OR: [{ slug: slugs[0] }, { id: slugs[0] }] };
      }
    }

    if (typeof brand === 'string' && brand) {
      where.brand = { OR: [{ slug: brand }, { id: brand }] };
    }

    if (typeof collection === 'string' && collection) {
      where.collection = { OR: [{ slug: collection }, { id: collection }] };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (typeof wearClass === 'string' && wearClass) {
      where.wearClass = { contains: wearClass };
    }
    if (typeof thickness === 'string' && thickness) where.thickness = Number(thickness);
    if (typeof color === 'string' && color) where.color = { contains: color };
    if (moistureResistant === '1') where.moistureResistant = true;
    if (underfloorHeating === '1') where.underfloorHeating = true;

    if (typeof city === 'string' && city) {
      where.stocks = {
        some: {
          city: { OR: [{ slug: city }, { id: city }] },
          status: { in: ['IN_STOCK', 'ON_ORDER'] },
        },
      };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * take;

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'name') orderBy = { name: 'asc' };
    if (sort === 'popular') orderBy = { featured: 'desc' };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: take,
      pages: Math.ceil(total / take),
    });
  }),
);

router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: productInclude,
    });
    if (!product || (!product.published && req.query.preview !== '1')) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
  }),
);

router.get(
  '/id/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude,
    });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  }),
);

const imageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  storageKey: z.string().optional().nullable(),
});

const charSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

const stockSchema = z.object({
  cityId: z.string(),
  status: z.enum(['IN_STOCK', 'ON_ORDER', 'OUT_OF_STOCK']),
  quantity: z.number().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  sku: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  oldPrice: z.number().min(0).optional().nullable(),
  discountPercent: z.number().optional().nullable(),
  unit: z.string().optional(),
  packQty: z.number().optional().nullable(),
  packArea: z.number().optional().nullable(),
  thickness: z.number().optional().nullable(),
  wearClass: z.string().optional().nullable(),
  length: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  color: z.string().optional().nullable(),
  bevel: z.string().optional().nullable(),
  lockType: z.string().optional().nullable(),
  moistureResistant: z.boolean().optional(),
  underfloorHeating: z.boolean().optional(),
  wearLayer: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  categoryId: z.string(),
  brandId: z.string(),
  collectionId: z.string().optional().nullable(),
  images: z.array(imageSchema).optional(),
  characteristics: z.array(charSchema).optional(),
  stocks: z.array(stockSchema).optional(),
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = productSchema.parse(req.body);
    const finalSlug = data.slug || slugify(`${data.name}-${data.sku}`);

    let discountPercent = data.discountPercent ?? null;
    if (!discountPercent && data.oldPrice && data.oldPrice > data.price) {
      discountPercent = Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100);
    }

    const { images, characteristics, stocks, ...rest } = data;

    const product = await prisma.product.create({
      data: {
        ...rest,
        slug: finalSlug,
        discountPercent,
        images: images?.length
          ? {
              create: images.map((img, i) => ({
                ...img,
                sortOrder: img.sortOrder ?? i,
                isPrimary: img.isPrimary ?? i === 0,
              })),
            }
          : undefined,
        characteristics: characteristics?.length
          ? { create: characteristics.map((c, i) => ({ ...c, sortOrder: c.sortOrder ?? i })) }
          : undefined,
        stocks: stocks?.length
          ? {
              create: stocks.map((s) => ({
                cityId: s.cityId,
                status: s.status,
                quantity: s.quantity ?? 0,
              })),
            }
          : undefined,
      },
      include: productInclude,
    });

    res.status(201).json(product);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = productSchema.partial().parse(req.body);
    const { images, characteristics, stocks, ...rest } = data;

    let discountPercent = rest.discountPercent;
    if (rest.oldPrice && rest.price && rest.oldPrice > rest.price) {
      discountPercent = Math.round(((rest.oldPrice - rest.price) / rest.oldPrice) * 100);
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: req.params.id },
        data: { ...rest, discountPercent },
      });

      if (images) {
        await tx.productImage.deleteMany({ where: { productId: req.params.id } });
        if (images.length) {
          await tx.productImage.createMany({
            data: images.map((img, i) => ({
              productId: req.params.id,
              url: img.url,
              alt: img.alt ?? null,
              isPrimary: img.isPrimary ?? i === 0,
              sortOrder: img.sortOrder ?? i,
              storageKey: img.storageKey ?? null,
            })),
          });
        }
      }

      if (characteristics) {
        await tx.productCharacteristic.deleteMany({ where: { productId: req.params.id } });
        if (characteristics.length) {
          await tx.productCharacteristic.createMany({
            data: characteristics.map((c, i) => ({
              productId: req.params.id,
              key: c.key,
              label: c.label,
              value: c.value,
              sortOrder: c.sortOrder ?? i,
            })),
          });
        }
      }

      if (stocks) {
        for (const s of stocks) {
          await tx.stock.upsert({
            where: {
              productId_cityId: { productId: req.params.id, cityId: s.cityId },
            },
            create: {
              productId: req.params.id,
              cityId: s.cityId,
              status: s.status,
              quantity: s.quantity ?? 0,
            },
            update: {
              status: s.status,
              quantity: s.quantity ?? 0,
            },
          });
        }
      }
    });

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude,
    });
    res.json(product);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

router.patch(
  '/:id/publish',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const published = Boolean(req.body.published);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { published },
    });
    res.json(product);
  }),
);

export default router;
