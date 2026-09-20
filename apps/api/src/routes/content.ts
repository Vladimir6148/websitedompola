import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole, slugify } from '../lib/auth.js';

const router = Router();

router.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const [banners, advantages, services, works, contacts, categories, featured, promotions, stores] =
      await Promise.all([
        prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.advantage.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.work.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, take: 8 }),
        prisma.contactInfo.findMany({ where: { active: true } }),
        prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.product.findMany({
          where: { published: true, featured: true },
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            brand: true,
            category: true,
          },
          take: 8,
        }),
        prisma.promotion.findMany({
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
          take: 4,
        }),
        prisma.store.findMany({ where: { active: true }, include: { city: true } }),
      ]);

    res.json({
      banners,
      advantages,
      services,
      works,
      contacts,
      categories,
      featured,
      promotions,
      stores,
    });
  }),
);

router.get(
  '/services',
  asyncHandler(async (_req, res) => {
    res.json(await prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }));
  }),
);

router.get(
  '/works',
  asyncHandler(async (_req, res) => {
    res.json(await prisma.work.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }));
  }),
);

router.get(
  '/cities',
  asyncHandler(async (_req, res) => {
    res.json(await prisma.city.findMany({ where: { active: true }, orderBy: { name: 'asc' } }));
  }),
);

router.get(
  '/characteristic-definitions',
  asyncHandler(async (_req, res) => {
    res.json(
      await prisma.characteristicDefinition.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
    );
  }),
);

router.post(
  '/characteristic-definitions',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      type: z.string().optional(),
      options: z.string().optional().nullable(),
      unit: z.string().optional().nullable(),
      sortOrder: z.number().int().optional(),
    });
    const data = schema.parse(req.body);
    const item = await prisma.characteristicDefinition.create({
      data: { ...data, key: data.key || slugify(data.label) },
    });
    res.status(201).json(item);
  }),
);

router.put(
  '/banners/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      title: z.string().optional(),
      subtitle: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      ctaText: z.string().optional().nullable(),
      ctaLink: z.string().optional().nullable(),
      sortOrder: z.number().int().optional(),
      active: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    res.json(await prisma.banner.update({ where: { id: req.params.id }, data }));
  }),
);

router.post(
  '/services',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      title: z.string(),
      slug: z.string().optional(),
      description: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      icon: z.string().optional().nullable(),
      sortOrder: z.number().int().optional(),
      active: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    res.status(201).json(
      await prisma.service.create({
        data: { ...data, slug: data.slug || slugify(data.title) },
      }),
    );
  }),
);

router.put(
  '/services/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    res.json(await prisma.service.update({ where: { id: req.params.id }, data: req.body }));
  }),
);

router.post(
  '/works',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      title: z.string(),
      slug: z.string().optional(),
      description: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      sortOrder: z.number().int().optional(),
      active: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    res.status(201).json(
      await prisma.work.create({
        data: { ...data, slug: data.slug || slugify(data.title) },
      }),
    );
  }),
);

router.put(
  '/works/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    res.json(await prisma.work.update({ where: { id: req.params.id }, data: req.body }));
  }),
);

export default router;
