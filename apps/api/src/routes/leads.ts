import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole } from '../lib/auth.js';

const router = Router();

const leadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  comment: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  meta: z.string().optional().nullable(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = leadSchema.parse(req.body);
    const lead = await prisma.lead.create({ data });
    res.status(201).json({ ok: true, id: lead.id });
  }),
);

router.get(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const leads = await prisma.lead.findMany({
      where: status ? { status: status as never } : undefined,
      include: { city: true, assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leads);
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      status: z.enum(['NEW', 'IN_PROGRESS', 'CONTACTED', 'COMPLETED', 'CANCELLED']).optional(),
      assignedToId: z.string().optional().nullable(),
      comment: z.string().optional().nullable(),
    });
    const data = schema.parse(req.body);
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data,
      include: { city: true },
    });
    res.json(lead);
  }),
);

export default router;
