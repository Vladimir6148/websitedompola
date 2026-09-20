import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole, slugify } from '../lib/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const all = req.query.all === '1';
    const brands = await prisma.brand.findMany({
      where: all ? undefined : { active: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(brands);
  }),
);

const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  logo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = brandSchema.parse(req.body);
    const slug = data.slug || slugify(data.name);
    const brand = await prisma.brand.create({ data: { ...data, slug } });
    res.status(201).json(brand);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = brandSchema.partial().parse(req.body);
    const brand = await prisma.brand.update({ where: { id: req.params.id }, data });
    res.json(brand);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.brand.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

export default router;
