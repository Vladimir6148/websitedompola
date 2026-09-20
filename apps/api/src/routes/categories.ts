import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole, slugify } from '../lib/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const all = req.query.all === '1';
    const categories = await prisma.category.findMany({
      where: all ? undefined : { active: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
    if (!category) return res.status(404).json({ error: 'Категория не найдена' });
    res.json(category);
  }),
);

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
  filterSchema: z.string().optional().nullable(),
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = categorySchema.parse(req.body);
    const slug = data.slug || slugify(data.name);
    const category = await prisma.category.create({
      data: { ...data, slug },
    });
    res.status(201).json(category);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json(category);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

export default router;
