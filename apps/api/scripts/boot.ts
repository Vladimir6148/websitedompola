import 'dotenv/config';
import { execSync } from 'node:child_process';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function ensureAdmin(prisma: PrismaClient) {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'vladimiradmin@dompola.ru').toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '122490gg';
  const name = process.env.BOOTSTRAP_ADMIN_NAME || 'VladimirAdmin';
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, name, role: 'ADMIN', active: true },
    update: { passwordHash, name, role: 'ADMIN', active: true },
  });
  console.log(`→ admin ready: ${name} / ${email}`);
}

async function main() {
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
    await ensureAdmin(prisma);
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
