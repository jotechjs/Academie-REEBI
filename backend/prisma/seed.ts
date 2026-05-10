import { PrismaClient, UserRole, LearnerStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Admin user ──────────────────────────────────────────────────────────────
  const admin = await prisma.learner.upsert({
    where: { email: 'admin@reebi.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'REEBI',
      email: 'admin@reebi.com',
      identifiant: 'ADMIN2026',
      role: UserRole.ADMIN,
      status: LearnerStatus.ADMITTED,
    },
  });
  console.log(`✅ Admin user ready: ${admin.email} (${admin.identifiant})`);

  // ── Test learners ───────────────────────────────────────────────────────────
  const learners = [
    {
      firstName: 'Alice',
      lastName: 'DUPONT',
      email: 'alice.dupont@reebi.com',
      identifiant: 'LEARNER2026-001',
    },
    {
      firstName: 'Bob',
      lastName: 'MARTIN',
      email: 'bob.martin@reebi.com',
      identifiant: 'LEARNER2026-002',
    },
    {
      firstName: 'Claire',
      lastName: 'BERNARD',
      email: 'claire.bernard@reebi.com',
      identifiant: 'LEARNER2026-003',
    },
  ];

  for (const data of learners) {
    const learner = await prisma.learner.upsert({
      where: { email: data.email },
      update: {},
      create: {
        ...data,
        role: UserRole.LEARNER,
        status: LearnerStatus.PENDING,
      },
    });
    console.log(`✅ Learner ready: ${learner.email} (${learner.identifiant})`);
  }

  console.log('🎉 Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
