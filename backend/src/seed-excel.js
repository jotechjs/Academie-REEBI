const { PrismaClient, SessionColumnDataType } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Excel seed...');
  
  const excelPath = path.resolve(__dirname, '../../Fichier_Assiduité_Academie_REEBI_Promo4_Version_Simplifiee-1.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error(`File not found: ${excelPath}`);
    return;
  }

  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // 1. Create the Promo 4 Session
  const sessionName = 'Promo 4';
  let session = await prisma.session.findFirst({ where: { name: sessionName } });
  
  if (!session) {
    session = await prisma.session.create({
      data: {
        name: sessionName,
        description: 'Importé depuis le fichier Excel global'
      }
    });
    console.log(`Created Session: ${session.name}`);
  } else {
    console.log(`Session ${session.name} already exists.`);
  }

  // 2. Iterate over each sheet
  for (const sheetName of workbook.SheetNames) {
    console.log(`Processing sheet: ${sheetName}`);
    const sheetData = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheetData, { header: 1 });

    if (jsonData.length === 0) continue;

    // Ensure the sheet exists in the session
    let sessionSheet = await prisma.sessionSheet.findFirst({
      where: { sessionId: session.id, name: sheetName }
    });

    if (!sessionSheet) {
      sessionSheet = await prisma.sessionSheet.create({
        data: { sessionId: session.id, name: sheetName }
      });
      console.log(`  Created Sheet: ${sheetName}`);
    }

    const headerRow = jsonData[0];
    const columnIds = [];

    // Create or find columns
    for (let i = 0; i < headerRow.length; i++) {
      const colName = headerRow[i];
      if (!colName) {
        columnIds.push('');
        continue;
      }

      let column = await prisma.sessionColumn.findUnique({
        where: { sessionSheetId_name: { sessionSheetId: sessionSheet.id, name: colName.toString() } }
      });

      if (!column) {
        column = await prisma.sessionColumn.create({
          data: {
            sessionSheetId: sessionSheet.id,
            name: colName.toString(),
            dataType: SessionColumnDataType ? SessionColumnDataType.TEXT : 'TEXT',
            position: i
          }
        });
      }
      columnIds.push(column.id);
    }

    // Process rows
    for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex];
      if (!row || row.length === 0) continue;

      // Find the student name, usually in column index 1 ("Académicien")
      let studentName = '';
      if (row.length > 1 && typeof row[1] === 'string' && row[1].trim() !== '') {
        studentName = row[1].trim();
      } else {
        // Fallback: look for any string that looks like a name
        for (const cell of row) {
          if (typeof cell === 'string' && cell.length > 3 && cell !== headerRow[row.indexOf(cell)]) {
            studentName = cell.trim();
            break;
          }
        }
      }

      if (!studentName) continue;

      // Find or create Learner
      const firstNameSearch = studentName.split(' ')[0];
      let learner = await prisma.learner.findFirst({
        where: {
          OR: [
            { lastName: { contains: firstNameSearch, mode: 'insensitive' } },
            { firstName: { contains: firstNameSearch, mode: 'insensitive' } }
          ]
        }
      });

      if (!learner) {
        const parts = studentName.split(' ');
        const lastName = parts[0];
        const firstName = parts.slice(1).join(' ') || ' ';
        const email = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@reebi.com`;

        try {
          learner = await prisma.learner.create({
            data: {
              firstName,
              lastName,
              email,
              status: 'ACTIVE'
            }
          });
          console.log(`  Created Learner: ${firstName} ${lastName}`);
        } catch (err) {
            console.error(`  Failed to create Learner ${firstName} ${lastName}:`, err.message);
            continue;
        }
      }

      // Upsert values
      for (let i = 0; i < row.length; i++) {
        const cellValue = row[i];
        const colId = columnIds[i];
        if (!colId || cellValue === undefined || cellValue === null) continue;

        await prisma.sessionValue.upsert({
          where: {
            sessionSheetId_sessionColumnId_learnerId: {
              sessionSheetId: sessionSheet.id,
              sessionColumnId: colId,
              learnerId: learner.id
            }
          },
          create: {
            sessionSheetId: sessionSheet.id,
            sessionColumnId: colId,
            learnerId: learner.id,
            value: cellValue.toString()
          },
          update: {
            value: cellValue.toString()
          }
        });
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
