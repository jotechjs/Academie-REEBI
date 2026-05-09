import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Learner } from '@prisma/client';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
import { LearnersService } from './learners.service';
import { CertificateService } from './certificate.service';

@Controller('learners')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class LearnersController {
  constructor(
    private readonly learnersService: LearnersService,
    private readonly certificateService: CertificateService,
  ) {}

  @Post()
  create(@Body() createLearnerDto: CreateLearnerDto): Promise<any> {
    return this.learnersService.create(createLearnerDto);
  }

  @Get()
  findAll(): Promise<any> {
    return this.learnersService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<any> {
    return this.learnersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  getDashboardStats(@CurrentUser() user: UserPayload) {
    return this.learnersService.getDashboardStats(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('certificate/generate')
  async generateCertificate(
    @CurrentUser() user: UserPayload,
    @Body() body: { moyenneCours: number; codeAttestation: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const stats = await this.learnersService.getDashboardStats(user.userId);
    
    if (stats.global.observation !== 'certifié') {
      return res.status(403).json({
        error: 'Not authorized to generate certificate',
      });
    }

    const pdfBuffer = await this.certificateService.generatePDF({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      moyenneCours: body.moyenneCours || stats.global.moyenneCours,
      codeAttestation: body.codeAttestation || stats.global.codeAttestation,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Attestation_REEBI_${user.firstName}_${user.lastName}.pdf"`,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="Attestation_REEBI_${user.firstName}_${user.lastName}.pdf"`,
    });
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateLearnerDto: UpdateLearnerDto,
  ) {
    return this.learnersService.update(id, updateLearnerDto);
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.learnersService.remove(id);
  }
}
