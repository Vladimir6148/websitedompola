import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/auth.js';

const router = Router();

const pickerSchema = z.object({
  room: z.enum(['living', 'bedroom', 'kitchen', 'hallway', 'kids', 'commercial']),
  priority: z.enum(['price', 'moisture', 'durability', 'look', 'care']),
  heating: z.enum(['yes', 'no', 'unknown']),
  style: z.enum(['light', 'natural', 'dark', 'modern', 'classic']),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = pickerSchema.parse(req.body);

    const where: Record<string, unknown> = { published: true };

    if (data.heating === 'yes') where.underfloorHeating = true;
    if (data.priority === 'moisture' || data.room === 'kitchen' || data.room === 'hallway') {
      where.moistureResistant = true;
    }

    if (data.style === 'light') where.color = { contains: 'светл' };
    if (data.style === 'dark') where.color = { contains: 'тёмн' };
    if (data.style === 'natural') where.color = { contains: 'дуб' };

    let categorySlugs: string[] = ['quartzvinyl-spc', 'laminate', 'linoleum'];
    if (data.room === 'commercial') categorySlugs = ['quartzvinyl-spc', 'porcelain', 'laminate'];
    if (data.priority === 'look') categorySlugs = ['parquet', 'quartzvinyl-spc', 'laminate'];

    const products = await prisma.product.findMany({
      where: {
        published: true,
        ...(data.heating === 'yes' ? { underfloorHeating: true } : {}),
        ...(data.priority === 'moisture' || data.room === 'kitchen' || data.room === 'hallway'
          ? { moistureResistant: true }
          : {}),
        category: { slug: { in: categorySlugs } },
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        brand: true,
        category: true,
      },
      orderBy: data.priority === 'price' ? { price: 'asc' } : { featured: 'desc' },
      take: 12,
    });

    // Fallback if filters too strict
    const items =
      products.length > 0
        ? products
        : await prisma.product.findMany({
            where: { published: true, category: { slug: { in: categorySlugs } } },
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              brand: true,
              category: true,
            },
            take: 12,
            orderBy: { price: 'asc' },
          });

    res.json({ items, criteria: data });
  }),
);

export default router;
