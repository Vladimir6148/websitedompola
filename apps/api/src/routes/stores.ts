import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole } from '../lib/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const all = req.query.all === '1';
    const stores = await prisma.store.findMany({
      where: all ? undefined : { active: true },
      include: { city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  }),
);

const storeSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  photos: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  active: z.boolean().optional(),
  cityId: z.string(),
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = storeSchema.parse(req.body);
    const store = await prisma.store.create({ data, include: { city: true } });
    res.status(201).json(store);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = storeSchema.partial().parse(req.body);
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data,
      include: { city: true },
    });
    res.json(store);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.store.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

export default router;
