import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
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

/** Simple in-memory rate limit for public lead form (per IP). */
const leadHits = new Map<string, { count: number; resetAt: number }>();
const LEAD_LIMIT = 8;
const LEAD_WINDOW_MS = 15 * 60 * 1000;

function rateLimitLeads(req: Request, res: Response, next: NextFunction) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  const now = Date.now();
  const entry = leadHits.get(ip);
  if (!entry || entry.resetAt < now) {
    leadHits.set(ip, { count: 1, resetAt: now + LEAD_WINDOW_MS });
    return next();
  }
  if (entry.count >= LEAD_LIMIT) {
    return res.status(429).json({ error: 'Слишком много заявок. Попробуйте позже или позвоните нам.' });
  }
  entry.count += 1;
  next();
}

router.post(
  '/',
  rateLimitLeads,
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
