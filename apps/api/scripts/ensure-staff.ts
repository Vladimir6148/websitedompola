/**
 * Upsert fixed admin/manager accounts (safe to run on every boot).
 * Usage: npx tsx scripts/ensure-staff.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { ensureStaffAccounts } from '../src/lib/staff.js';

async function main() {
  try {
    const staff = await ensureStaffAccounts();
    for (const row of staff) console.log(`→ ${row}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
