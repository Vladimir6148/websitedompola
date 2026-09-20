import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole, slugify } from '../lib/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const all = req.query.all === '1';
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: all
        ? undefined
        : {
            active: true,
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
          },
      include: { category: true, city: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(promotions);
  }),
);

const promoSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  discountPercent: z.number().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  productIds: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = promoSchema.parse(req.body);
    const promotion = await prisma.promotion.create({
      data: {
        ...data,
        slug: data.slug || slugify(data.title),
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
      include: { category: true, city: true },
    });
    res.status(201).json(promotion);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = promoSchema.partial().parse(req.body);
    const promotion = await prisma.promotion.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startsAt: data.startsAt === undefined ? undefined : data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt === undefined ? undefined : data.endsAt ? new Date(data.endsAt) : null,
      },
      include: { category: true, city: true },
    });
    res.json(promotion);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.promotion.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

export default router;
