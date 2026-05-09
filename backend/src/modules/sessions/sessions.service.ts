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

  async importExcel(sessionId: string, fileBuffer: Buffer): Promise<void> {
    await this.ensureSessionExists(sessionId);

    // Parse Excel file
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    } catch (e) {
      throw new BadRequestException('Invalid Excel file format');
    }

    const learners = await this.prisma.learner.findMany();

    // Iterate over each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheetData = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(sheetData, { header: 1 });

      if (jsonData.length === 0) continue;

      // Ensure the sheet exists in the session
      let sessionSheet = await this.prisma.sessionSheet.findFirst({
        where: { sessionId, name: sheetName }
      });

      if (!sessionSheet) {
        sessionSheet = await this.prisma.sessionSheet.create({
          data: { sessionId, name: sheetName }
        });
      }

      const headerRow = jsonData[0];
      const columnIds: string[] = [];

      // Create or find columns
      for (let i = 0; i < headerRow.length; i++) {
        const colName = headerRow[i];
        if (!colName) {
          columnIds.push('');
          continue;
        }

        let column = await this.prisma.sessionColumn.findUnique({
          where: { sessionSheetId_name: { sessionSheetId: sessionSheet.id, name: colName.toString() } }
        });

        if (!column) {
          column = await this.prisma.sessionColumn.create({
            data: {
              sessionSheetId: sessionSheet.id,
              name: colName.toString(),
              dataType: SessionColumnDataType.TEXT,
              position: i
            }
          });
        }
        columnIds.push(column.id);
      }

      // Try to map learners by Name (Assuming the 2nd column is 'Académicien' based on the sample)
      for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex];
        if (!row || row.length === 0) continue;

        // Simple fuzzy match for learner name (concatenating first and last name)
        // In a production app, we'd want a more robust matching strategy, but this is the best effort for an import.
        let matchedLearner = null;
        for (const cell of row) {
          if (typeof cell === 'string') {
             matchedLearner = learners.find(l => 
               cell.toLowerCase().includes(l.lastName.toLowerCase()) || 
               cell.toLowerCase().includes(l.firstName.toLowerCase())
             );
             if (matchedLearner) break;
          }
        }

        if (matchedLearner) {
           for (let i = 0; i < row.length; i++) {
              const cellValue = row[i];
              const colId = columnIds[i];
              if (!colId || cellValue === undefined || cellValue === null) continue;

              await this.prisma.sessionValue.upsert({
                where: {
                  sessionSheetId_sessionColumnId_learnerId: {
                    sessionSheetId: sessionSheet.id,
                    sessionColumnId: colId,
                    learnerId: matchedLearner.id
                  }
                },
                create: {
                  sessionSheetId: sessionSheet.id,
                  sessionColumnId: colId,
                  learnerId: matchedLearner.id,
                  value: cellValue.toString()
                },
                update: {
                  value: cellValue.toString()
                }
              });
           }
        }
      }
    }
  }

  private async ensureSessionExists(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!session) throw new NotFoundException(`Session with id "${sessionId}" not found`);
  }

  private async ensureSheetExists(sheetId: string): Promise<void> {
    const sheet = await this.prisma.sessionSheet.findUnique({
      where: { id: sheetId },
      select: { id: true },
    });
    if (!sheet) throw new NotFoundException(`Sheet with id "${sheetId}" not found`);
  }

  private async ensureColumnExistsInSheet(sheetId: string, sessionColumnId: string): Promise<void> {
    const column = await this.prisma.sessionColumn.findFirst({
      where: { id: sessionColumnId, sessionSheetId: sheetId },
      select: { id: true },
    });
    if (!column) throw new NotFoundException(`Column with id "${sessionColumnId}" not found in sheet "${sheetId}"`);
  }

  private async ensureLearnerExists(learnerId: string): Promise<void> {
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
      select: { id: true },
    });
    if (!learner) throw new NotFoundException(`Learner with id "${learnerId}" not found`);
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
