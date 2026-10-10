import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, requireAuth, requireRole } from '../lib/auth.js';

const router = Router();

const DEFAULT_EMPLOYEES = [
  'Дмитрий',
  'Денис',
  'Владимир',
  'Даниил',
  'Анастасия',
  'Галина',
];

function dayStart(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function monthRange(year: number, month: number) {
  // month: 1–12
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return { from, to };
}

async function ensureEmployees() {
  const count = await prisma.employee.count();
  if (count > 0) return;
  await prisma.employee.createMany({
    data: DEFAULT_EMPLOYEES.map((name, i) => ({ name, sortOrder: i })),
  });
}

router.use(requireAuth, requireRole('ADMIN', 'MANAGER'));

/** Dashboard bundle for one month. */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    await ensureEmployees();
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const { from, to } = monthRange(year, month);

    const [events, turnovers, employees, shifts, stores] = await Promise.all([
      prisma.opsEvent.findMany({
        where: { date: { gte: from, lt: to } },
        orderBy: { date: 'asc' },
      }),
      prisma.storeTurnover.findMany({
        where: { date: { gte: from, lt: to } },
        include: { store: { include: { city: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.employee.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.workShift.findMany({
        where: { date: { gte: from, lt: to } },
        select: { employeeId: true, date: true, id: true },
      }),
      prisma.store.findMany({
        where: { active: true },
        include: { city: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const byStore: Record<string, { storeId: string; name: string; city: string; total: number }> = {};
    for (const s of stores) {
      byStore[s.id] = {
        storeId: s.id,
        name: s.name,
        city: s.city?.name || '',
        total: 0,
      };
    }
    for (const t of turnovers) {
      if (!byStore[t.storeId]) {
        byStore[t.storeId] = {
          storeId: t.storeId,
          name: t.store.name,
          city: t.store.city?.name || '',
          total: 0,
        };
      }
      byStore[t.storeId]!.total += t.amount;
    }

    const storeTotals = Object.values(byStore).sort((a, b) => b.total - a.total);
    const monthTotal = storeTotals.reduce((s, x) => s + x.total, 0);

    res.json({
      year,
      month,
      events,
      turnovers,
      storeTotals,
      monthTotal,
      employees,
      shifts: shifts.map((s) => ({
        id: s.id,
        employeeId: s.employeeId,
        date: s.date.toISOString().slice(0, 10),
      })),
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        city: s.city?.name || '',
      })),
    });
  }),
);

router.post(
  '/events',
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        title: z.string().min(1),
        date: z.string().min(8),
        note: z.string().optional().nullable(),
      })
      .parse(req.body);
    const event = await prisma.opsEvent.create({
      data: {
        title: data.title.trim(),
        date: dayStart(data.date),
        note: data.note?.trim() || null,
      },
    });
    res.status(201).json(event);
  }),
);

router.delete(
  '/events/:id',
  asyncHandler(async (req, res) => {
    await prisma.opsEvent.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

router.post(
  '/turnovers',
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        storeId: z.string().min(1),
        date: z.string().min(8),
        amount: z.number().min(0),
        note: z.string().optional().nullable(),
      })
      .parse(req.body);
    const date = dayStart(data.date);
    const row = await prisma.storeTurnover.upsert({
      where: { storeId_date: { storeId: data.storeId, date } },
      create: {
        storeId: data.storeId,
        date,
        amount: data.amount,
        note: data.note?.trim() || null,
      },
      update: {
        amount: data.amount,
        note: data.note?.trim() || null,
      },
      include: { store: { include: { city: true } } },
    });
    res.json(row);
  }),
);

router.delete(
  '/turnovers/:id',
  asyncHandler(async (req, res) => {
    await prisma.storeTurnover.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

/** Toggle work day for employee (create if missing, delete if exists). */
router.post(
  '/shifts/toggle',
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        employeeId: z.string().min(1),
        date: z.string().min(8),
      })
      .parse(req.body);
    const date = dayStart(data.date);
    const existing = await prisma.workShift.findUnique({
      where: {
        employeeId_date: { employeeId: data.employeeId, date },
      },
    });
    if (existing) {
      await prisma.workShift.delete({ where: { id: existing.id } });
      return res.json({ work: false, employeeId: data.employeeId, date: data.date });
    }
    await prisma.workShift.create({
      data: { employeeId: data.employeeId, date },
    });
    res.json({ work: true, employeeId: data.employeeId, date: data.date });
  }),
);

router.post(
  '/employees',
  asyncHandler(async (req, res) => {
    const data = z.object({ name: z.string().min(1) }).parse(req.body);
    const max = await prisma.employee.aggregate({ _max: { sortOrder: true } });
    const emp = await prisma.employee.create({
      data: {
        name: data.name.trim(),
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    res.status(201).json(emp);
  }),
);

export default router;
