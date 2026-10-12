import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';
import { prisma } from './prisma.js';

export const STAFF: Array<{ email: string; password: string; name: string; role: Role }> = [
  {
    email: 'vladimiradmin@dompola.ru',
    password: '122490gg',
    name: 'VladimirAdmin',
    role: 'ADMIN',
  },
  {
    email: 'dmitry@dompola.ru',
    password: '180823',
    name: 'Dmitry',
    role: 'ADMIN',
  },
  {
    email: 'denis@dompola.ru',
    password: 'Rota4029307',
    name: 'Denis',
    role: 'ADMIN',
  },
  {
    email: 'manager@dompola.ru',
    password: 'manager123',
    name: 'Менеджер',
    role: 'MANAGER',
  },
];

/** Upsert fixed staff accounts. All three named admins get full ADMIN access. */
export async function ensureStaffAccounts() {
  await prisma.user.updateMany({
    where: { email: { in: ['dmitryadmin@dompola.ru', 'denisadmin@dompola.ru'] } },
    data: { active: false },
  });

  const created: string[] = [];
  for (const u of STAFF) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        active: true,
      },
      update: {
        passwordHash,
        name: u.name,
        role: u.role,
        active: true,
      },
    });
    created.push(`${u.role}:${u.name}`);
  }
  return created;
}
