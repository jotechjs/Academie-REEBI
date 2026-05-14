import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: any, @Body() createExperienceDto: CreateExperienceDto) {
    // Ensure we capture the learner identifier from the JWT payload.
    const learnerId = user.userId ?? user.id ?? user.sub;
    return await this.experiencesService.create(learnerId, createExperienceDto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return await this.experiencesService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@CurrentUser() user: any) {
    if (user.role !== UserRole.ADMIN) {
      return { error: 'Unauthorized' };
    }
    return await this.experiencesService.getStats();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') experienceId: string, @CurrentUser() user: any) {
    if (user.role !== UserRole.ADMIN) {
      return { error: 'Unauthorized' };
    }
    return await this.experiencesService.delete(experienceId);
  }
}
