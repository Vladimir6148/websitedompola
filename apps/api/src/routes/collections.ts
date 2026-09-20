import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole, slugify } from '../lib/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const brandId = typeof req.query.brand === 'string' ? req.query.brand : undefined;
    const collections = await prisma.collection.findMany({
      where: brandId ? { brandId } : undefined,
      orderBy: { name: 'asc' },
      include: { brand: true, _count: { select: { products: true } } },
    });
    res.json(collections);
  }),
);

const collectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  brandId: z.string().min(1),
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = collectionSchema.parse(req.body);
    const slug = data.slug || slugify(data.name);
    const collection = await prisma.collection.create({
      data: { name: data.name, slug, brandId: data.brandId },
    });
    res.status(201).json(collection);
  }),
);

export default router;
