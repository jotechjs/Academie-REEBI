import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Learner, Session, SessionColumn, SessionSheet, SessionValue } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpsertValueDto } from './dto/upsert-value.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { SessionsService } from './sessions.service';

type SessionSheetDataResponse = {
  columns: SessionColumn[];
  learners: Learner[];
  values: SessionValue[];
};

@Controller('sessions')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() createSessionDto: CreateSessionDto): Promise<Session> {
    return this.sessionsService.create(createSessionDto);
  }

  @Get()
  findAll(): Promise<(Session & { sheets: SessionSheet[] })[]> {
    return this.sessionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<Session & { sheets: SessionSheet[] }> {
    return this.sessionsService.findOne(id);
  }

  @Post(':sessionId/sheets')
  createSheet(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body('name') name: string,
  ): Promise<SessionSheet> {
    return this.sessionsService.createSheet(sessionId, name);
  }

  @Post(':sessionId/import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @UploadedFile() file: any,
  ): Promise<{ message: string; importedSheets: string[] }> {
    const result = await this.sessionsService.importExcel(sessionId, file.buffer);
    const sheetCount = result.importedSheets.length;
    return {
      message: `Import réussi : ${sheetCount} feuille${sheetCount > 1 ? 's' : ''} importée${sheetCount > 1 ? 's' : ''} (${result.importedSheets.join(', ')})`,
      importedSheets: result.importedSheets,
    };
  }

  @Delete('sheets/:sheetId')
  deleteSheet(
    @Param('sheetId', new ParseUUIDPipe({ version: '4' })) sheetId: string,
  ): Promise<{ message: string }> {
    return this.sessionsService.deleteSheet(sheetId);
  }

  @Get('sheets/:sheetId/data')
  getSheetData(
    @Param('sheetId', new ParseUUIDPipe({ version: '4' })) sheetId: string,
  ): Promise<SessionSheetDataResponse> {
    return this.sessionsService.getSheetData(sheetId);
  }

  @Put('sheets/:sheetId/values')
  upsertValue(
    @Param('sheetId', new ParseUUIDPipe({ version: '4' })) sheetId: string,
    @Body() upsertValueDto: UpsertValueDto,
  ): Promise<SessionValue> {
    return this.sessionsService.upsertValue(sheetId, upsertValueDto);
  }

  @Post('sheets/:sheetId/columns')
  createColumn(
    @Param('sheetId', new ParseUUIDPipe({ version: '4' })) sheetId: string,
    @Body() createColumnDto: CreateColumnDto,
  ): Promise<SessionColumn> {
    return this.sessionsService.createColumn(sheetId, createColumnDto);
  }

  @Delete('sheets/:sheetId/columns/:columnId')
  deleteColumn(
    @Param('sheetId', new ParseUUIDPipe({ version: '4' })) sheetId: string,
    @Param('columnId', new ParseUUIDPipe({ version: '4' })) columnId: string,
  ): Promise<{ message: string }> {
    return this.sessionsService.deleteColumn(sheetId, columnId);
  }
}
