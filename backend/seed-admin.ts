import { PrismaClient, UserRole, LearnerStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@reebi.com';
  let admin = await prisma.learner.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    admin = await prisma.learner.create({
      data: {
        firstName: 'Admin',
        lastName: 'REEBI',
        email: adminEmail,
        role: UserRole.ADMIN,
        status: LearnerStatus.ADMITTED,
      },
    });
    console.log('Admin user created:', admin.email);
  } else {
    console.log('Admin user already exists:', admin.email);
  }
}

main()
  .catch(e => {
    console.error(e);
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
