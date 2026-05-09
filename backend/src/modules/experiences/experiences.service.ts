import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(learnerId: string, createExperienceDto: CreateExperienceDto) {
    return this.prisma.experience.create({
      data: {
        ...createExperienceDto,
        learnerId,
      },
    });
  }

  async findAll() {
    return this.prisma.experience.findMany({
      include: {
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async delete(experienceId: string) {
    return this.prisma.experience.delete({
      where: { id: experienceId },
    });
  }
}
