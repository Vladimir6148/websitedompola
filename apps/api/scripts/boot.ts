import 'dotenv/config';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

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
