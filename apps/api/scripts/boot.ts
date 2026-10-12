import 'dotenv/config';
import { execSync } from 'node:child_process';
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

async function ensureStaff(prisma: PrismaClient) {
  // Disable old *Admin login aliases if they still exist.
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
}

async function main() {
  console.log('→ prisma generate');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('→ prisma db push');
  execSync('npx prisma db push', { stdio: 'inherit' });

  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.count();
    if (users === 0) {
      console.log('→ seed');
      execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    } else {
      console.log(`→ skip seed (${users} users)`);
    }
    console.log('→ ensure staff accounts');
    await ensureStaff(prisma);
  } finally {
    await prisma.$disconnect();
  }

  console.log('→ start API');
  execSync('npx tsx src/index.ts', { stdio: 'inherit' });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
