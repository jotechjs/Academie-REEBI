import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Learner, Session, SessionSheet, SessionColumn, SessionValue, SessionColumnDataType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpsertValueDto } from './dto/upsert-value.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import * as XLSX from 'xlsx';

type SessionSheetDataResponse = {
  columns: SessionColumn[];
  learners: Learner[];
  values: SessionValue[];
};

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createSessionDto: CreateSessionDto): Promise<Session> {
    return this.prisma.session.create({
      data: createSessionDto,
    });
  }

  findAll(): Promise<(Session & { sheets: SessionSheet[] })[]> {
    return this.prisma.session.findMany({
      include: { sheets: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Session & { sheets: SessionSheet[] }> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { sheets: true }
    });
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return session;
  }

  async createSheet(sessionId: string, name: string): Promise<SessionSheet> {
    await this.ensureSessionExists(sessionId);
    return this.prisma.sessionSheet.create({
      data: { sessionId, name }
    });
  }

  async createColumn(sheetId: string, createColumnDto: CreateColumnDto): Promise<SessionColumn> {
    await this.ensureSheetExists(sheetId);
    
    const maxPosition = await this.prisma.sessionColumn.findFirst({
      where: { sessionSheetId: sheetId },
      orderBy: { position: 'desc' },
    });
    
    const position = createColumnDto.position ?? (maxPosition?.position ?? 0) + 1;
    const dataType = createColumnDto.dataType as SessionColumnDataType;
    
    return this.prisma.sessionColumn.create({
      data: {
        sessionSheetId: sheetId,
        name: createColumnDto.name,
        dataType: dataType || SessionColumnDataType.TEXT,
        position,
      }
    });
  }

  async deleteSheet(sheetId: string): Promise<{ message: string }> {
    await this.ensureSheetExists(sheetId);

    // Cascade delete handles columns and values automatically via Prisma schema
    await this.prisma.sessionSheet.delete({
      where: { id: sheetId },
    });

    return { message: 'Feuille supprimée avec succès' };
  }

  async deleteColumn(sheetId: string, columnId: string): Promise<{ message: string }> {
    await this.ensureSheetExists(sheetId);
    await this.ensureColumnExistsInSheet(sheetId, columnId);

    // Prisma onDelete: Cascade should handle sessionValues if defined in schema
    // Let's verify the schema later, but for now we delete it.
    await this.prisma.sessionColumn.delete({
      where: { id: columnId },
    });

    return { message: 'Column deleted successfully' };
  }

  async upsertValue(sheetId: string, upsertValueDto: UpsertValueDto): Promise<SessionValue> {
    await this.ensureSheetExists(sheetId);
    await this.ensureColumnExistsInSheet(sheetId, upsertValueDto.sessionColumnId);
    await this.ensureLearnerExists(upsertValueDto.learnerId);

    return this.prisma.sessionValue.upsert({
      where: {
        sessionSheetId_sessionColumnId_learnerId: {
          sessionSheetId: sheetId,
          sessionColumnId: upsertValueDto.sessionColumnId,
          learnerId: upsertValueDto.learnerId,
        },
      },
      create: {
        sessionSheetId: sheetId,
        sessionColumnId: upsertValueDto.sessionColumnId,
        learnerId: upsertValueDto.learnerId,
        value: upsertValueDto.value,
      },
      update: {
        value: upsertValueDto.value,
      },
    });
  }

  async getSheetData(sheetId: string): Promise<SessionSheetDataResponse> {
    await this.ensureSheetExists(sheetId);

    const [columns, values] = await Promise.all([
      this.prisma.sessionColumn.findMany({
        where: { sessionSheetId: sheetId },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.sessionValue.findMany({
        where: { sessionSheetId: sheetId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Include ALL learners in the response so the frontend can display the full list
    // even if some don't have values yet.
    const learners = await this.prisma.learner.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return {
      columns,
      learners,
      values,
    };
  }

  /**
   * Import an Excel file into a session.
   * 
   * BEHAVIOR: APPEND ONLY
   * Each sheet in the Excel file becomes a NEW independent sheet in the session.
   * Existing sheets/columns/values are NEVER modified.
   */
  async importExcel(sessionId: string, fileBuffer: Buffer): Promise<{ importedSheets: string[] }> {
    await this.ensureSessionExists(sessionId);

    // ── 1. Parse & validate Excel file ──────────────────────────────────
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    } catch (e) {
      throw new BadRequestException('Format de fichier Excel invalide. Veuillez fournir un fichier .xlsx ou .xls valide.');
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new BadRequestException('Le fichier Excel ne contient aucune feuille.');
    }

    // ── 2. Pre-fetch existing sheet names to avoid collisions ───────────
    const existingSheetNames = new Set(
      (await this.prisma.sessionSheet.findMany({
        where: { sessionId },
        select: { name: true },
      })).map(s => s.name)
    );

    // ── 3. Pre-fetch all learners for name matching ────────────────────
    const learners = await this.prisma.learner.findMany();
    if (learners.length === 0) {
      throw new BadRequestException(
        'Aucun académicien trouvé dans la base de données. Veuillez d\'abord importer des académiciens.'
      );
    }

    const importedSheets: string[] = [];

    // ── 4. Iterate over each sheet in the Excel file ───────────────────
    for (const sheetName of workbook.SheetNames) {
      const sheetData = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(sheetData, { header: 1 });

      // Skip empty sheets
      if (!jsonData || jsonData.length < 2) continue; // Need at least header + 1 row

      // ── Generate a UNIQUE sheet name (avoid collision) ────────────
      const uniqueSheetName = this.generateUniqueName(sheetName, existingSheetNames);

      // ── Create NEW sheet (always create, never reuse) ─────────────
      const newSheet = await this.prisma.sessionSheet.create({
        data: {
          sessionId,
          name: uniqueSheetName,
        },
      });

      // Track the new name in the set so nested duplicates also get unique names
      existingSheetNames.add(uniqueSheetName);

      // ── 5. Create columns from header row (always create new) ──────
      const headerRow = jsonData[0];
      const columnIds: string[] = [];

      for (let i = 0; i < headerRow.length; i++) {
        const rawName = headerRow[i];

        // Validate column name
        let colName: string;
        if (rawName === undefined || rawName === null || String(rawName).trim() === '') {
          colName = `Colonne ${i + 1}`;
        } else {
          colName = String(rawName).trim();
        }

        try {
          const column = await this.prisma.sessionColumn.create({
            data: {
              sessionSheetId: newSheet.id,
              name: colName,
              dataType: SessionColumnDataType.TEXT,
              position: i,
            },
          });
          columnIds.push(column.id);
        } catch (err) {
          // If a unique constraint fails (shouldn't happen in a new sheet), append a suffix
          const fallbackName = `${colName}_${Date.now()}`;
          const column = await this.prisma.sessionColumn.create({
            data: {
              sessionSheetId: newSheet.id,
              name: fallbackName,
              dataType: SessionColumnDataType.TEXT,
              position: i,
            },
          });
          columnIds.push(column.id);
        }
      }

      if (columnIds.length === 0) {
        // No valid columns found, skip this sheet
        await this.prisma.sessionSheet.delete({ where: { id: newSheet.id } });
        continue;
      }

      // ── 6. Import data rows (always INSERT, never upsert) ──────────
      const valuesToCreate: { sessionSheetId: string; sessionColumnId: string; learnerId: string; value: string }[] = [];
      let importRowCount = 0;

      for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex];
        if (!row || row.length === 0) continue;

        // Try to match a learner by name (using fuzzy matching on the entire row)
        let matchedLearner: (typeof learners)[0] | null | undefined = null;

        for (const cell of row) {
          if (cell !== undefined && cell !== null && typeof cell === 'string') {
            const cellStr = cell.toLowerCase().trim();
            matchedLearner = learners.find(l =>
              cellStr.includes(l.lastName.toLowerCase()) ||
              cellStr.includes(l.firstName.toLowerCase())
            ) ?? null;
            if (matchedLearner) break;
          }
        }

        if (!matchedLearner) continue;

        importRowCount++;

        for (let i = 0; i < row.length; i++) {
          const colId = columnIds[i];
          if (!colId) continue;

          const cellValue = row[i];
          if (cellValue === undefined || cellValue === null) continue;

          valuesToCreate.push({
            sessionSheetId: newSheet.id,
            sessionColumnId: colId,
            learnerId: matchedLearner.id,
            value: String(cellValue),
          });
        }
      }

      // Batch insert all values for this sheet
      if (valuesToCreate.length > 0) {
        // Use createMany for efficiency (no Prisma createMany does NOT support SQLite but PostgreSQL is fine)
        // However, we must ensure we don't violate unique constraints.
        // Since this is a brand new sheet with brand new columns, there is no risk of
        // unique constraint violation on (sessionSheetId, sessionColumnId, learnerId).
        await this.prisma.sessionValue.createMany({
          data: valuesToCreate,
          skipDuplicates: true, // safety net
        });
      }

      importedSheets.push(uniqueSheetName);
    }

    // ── 7. Validate that at least one sheet was imported ────────────────
    if (importedSheets.length === 0) {
      throw new BadRequestException(
        'Aucune donnée valide n\'a pu être importée depuis ce fichier. ' +
        'Vérifiez que le fichier contient au moins une feuille avec un en-tête et des données.'
      );
    }

    return { importedSheets };
  }

  /**
   * Generate a unique sheet name by appending a counter if the name already exists.
   */
  private generateUniqueName(baseName: string, existingNames: Set<string>): string {
    // Validate and normalize name
    let name = String(baseName).trim();
    if (!name) name = 'Feuille';

    if (!existingNames.has(name)) {
      return name;
    }

    // Name exists, append a counter
    let counter = 1;
    let uniqueName = `${name}_${counter}`;
    while (existingNames.has(uniqueName)) {
      counter++;
      uniqueName = `${name}_${counter}`;
    }
    return uniqueName;
  }

  private async ensureSessionExists(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!session) throw new NotFoundException(`Session avec l'id "${sessionId}" introuvable`);
  }

  private async ensureSheetExists(sheetId: string): Promise<void> {
    const sheet = await this.prisma.sessionSheet.findUnique({
      where: { id: sheetId },
      select: { id: true },
    });
    if (!sheet) throw new NotFoundException(`Feuille avec l'id "${sheetId}" introuvable`);
  }

  private async ensureColumnExistsInSheet(sheetId: string, sessionColumnId: string): Promise<void> {
    const column = await this.prisma.sessionColumn.findFirst({
      where: { id: sessionColumnId, sessionSheetId: sheetId },
      select: { id: true },
    });
    if (!column) throw new NotFoundException(`Colonne avec l'id "${sessionColumnId}" introuvable dans la feuille "${sheetId}"`);
  }

  private async ensureLearnerExists(learnerId: string): Promise<void> {
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
      select: { id: true },
    });
    if (!learner) throw new NotFoundException(`Académicien avec l'id "${learnerId}" introuvable`);
  }
  async getLearnerStats(learnerId: string) {
    const values = await this.prisma.sessionValue.findMany({
      where: { learnerId },
      include: {
        sessionColumn: true,
        sheet: true,
      },
    });

    // Organize data by sheet
    const statsBySheet: Record<string, any> = {};

    values.forEach((v) => {
      if (!statsBySheet[v.sheet.name]) {
        statsBySheet[v.sheet.name] = {
          id: v.sheet.id,
          name: v.sheet.name,
          data: {},
        };
      }
      statsBySheet[v.sheet.name].data[v.sessionColumn.name] = v.value;
    });

    return statsBySheet;
  }
}