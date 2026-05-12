import { PrismaClient, SessionColumnDataType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Sessions seed...');

  const learners = await prisma.learner.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  console.log(`Found ${learners.length} learners in database`);

  if (learners.length === 0) {
    console.log('No learners found. Please ensure learners exist before running this seed.');
    return;
  }

  const session = await prisma.session.create({
    data: {
      name: 'Promo 4',
      description: 'Promotion 4 - Année académique 2025-2026',
      sheets: {
        create: [
          {
            name: 'Liste_Academiciens',
            columns: {
              create: [
                { name: 'Académicien', dataType: SessionColumnDataType.TEXT, position: 1 },
                { name: 'Nom', dataType: SessionColumnDataType.TEXT, position: 2 },
                { name: 'Prénom', dataType: SessionColumnDataType.TEXT, position: 3 },
                { name: 'Email', dataType: SessionColumnDataType.TEXT, position: 4 },
                { name: 'Téléphone', dataType: SessionColumnDataType.TEXT, position: 5 },
                { name: 'Statut', dataType: SessionColumnDataType.TEXT, position: 6 },
              ],
            },
          },
          {
            name: 'Presence_Globale',
            columns: {
              create: [
                { name: 'Académicien', dataType: SessionColumnDataType.TEXT, position: 1 },
                { name: 'Janvier', dataType: SessionColumnDataType.NUMBER, position: 2 },
                { name: 'Février', dataType: SessionColumnDataType.NUMBER, position: 3 },
                { name: 'Mars', dataType: SessionColumnDataType.NUMBER, position: 4 },
                { name: 'Avril', dataType: SessionColumnDataType.NUMBER, position: 5 },
                { name: 'Mai', dataType: SessionColumnDataType.NUMBER, position: 6 },
                { name: 'Juin', dataType: SessionColumnDataType.NUMBER, position: 7 },
                { name: 'Total', dataType: SessionColumnDataType.NUMBER, position: 8 },
              ],
            },
          },
          {
            name: 'Contrôle cahiers',
            columns: {
              create: [
                { name: 'Académicien', dataType: SessionColumnDataType.TEXT, position: 1 },
                { name: 'Cahier 1', dataType: SessionColumnDataType.TEXT, position: 2 },
                { name: 'Cahier 2', dataType: SessionColumnDataType.TEXT, position: 3 },
                { name: 'Cahier 3', dataType: SessionColumnDataType.TEXT, position: 4 },
                { name: 'Cahier 4', dataType: SessionColumnDataType.TEXT, position: 5 },
                { name: 'Note finale', dataType: SessionColumnDataType.NUMBER, position: 6 },
              ],
            },
          },
        ],
      },
    },
    include: {
      sheets: {
        include: {
          columns: true,
        },
      },
    },
  });

  console.log(`Created session: ${session.name} with ${session.sheets.length} sheets`);

  for (const sheet of session.sheets) {
    console.log(`  Sheet: ${sheet.name} with ${sheet.columns.length} columns`);

    const academicienColumn = sheet.columns.find((c) => c.name === 'Académicien');

    if (learners.length > 0 && academicienColumn) {
      for (const learner of learners) {
        const fullName = `${learner.lastName} ${learner.firstName}`;

        if (sheet.name === 'Liste_Academiciens') {
          await prisma.sessionValue.create({
            data: {
              sessionSheetId: sheet.id,
              sessionColumnId: academicienColumn.id,
              learnerId: learner.id,
              value: fullName,
            },
          });
        } else if (sheet.name === 'Presence_Globale') {
          const presenceColumn = sheet.columns.find((c) => c.name === 'Janvier');
          if (presenceColumn) {
            await prisma.sessionValue.create({
              data: {
                sessionSheetId: sheet.id,
                sessionColumnId: presenceColumn.id,
                learnerId: learner.id,
                value: Math.floor(Math.random() * 10 + 10).toString(),
              },
            });
          }
        } else if (sheet.name === 'Contrôle cahiers') {
          const cahier1Column = sheet.columns.find((c) => c.name === 'Cahier 1');
          if (cahier1Column) {
            await prisma.sessionValue.create({
              data: {
                sessionSheetId: sheet.id,
                sessionColumnId: cahier1Column.id,
                learnerId: learner.id,
                value: 'Vérifié',
              },
            });
          }
        }
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });