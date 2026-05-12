import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const learners = [
    {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@reebi.com',
      identifiant: 'JD2024',
      role: 'LEARNER' as UserRole,
    },
    {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@reebi.com',
      identifiant: 'MM2024',
      role: 'LEARNER' as UserRole,
    },
    {
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'pierre.durand@reebi.com',
      identifiant: 'PD2024',
      role: 'LEARNER' as UserRole,
    },
  ];

  for (const learner of learners) {
    await prisma.learner.upsert({
      where: { email: learner.email },
      update: {},
      create: learner,
    });
    console.log(`Created learner: ${learner.email}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });