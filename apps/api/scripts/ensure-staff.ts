/**
 * Upsert fixed admin/manager accounts (safe to run on every boot).
 * Usage: npx tsx scripts/ensure-staff.ts
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Role } from '@prisma/client';

const STAFF: Array<{ email: string; password: string; name: string; role: Role }> = [
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

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.user.updateMany({
      where: { email: { in: ['dmitryadmin@dompola.ru', 'denisadmin@dompola.ru'] } },
      data: { active: false },
    });

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
      console.log(`→ ${u.role}: ${u.name} <${u.email}>`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
