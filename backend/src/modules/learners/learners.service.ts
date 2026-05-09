import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Learner, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class LearnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
  ) {}

  async getDashboardStats(learnerId: string) {
    const stats = await this.sessionsService.getLearnerStats(learnerId);
    
    // Format the response for the frontend
    // We expect sheets like 'Presence_Globale', 'Contrôle cahiers', 'Liste_Academiciens'
    
    const presenceSheet = stats['Presence_Globale'] || { data: {} };
    const rapportsSheet = stats['Contrôle cahiers'] || { data: {} };
    const recapSheet = stats['Liste_Academiciens'] || { data: {} };

    // Helper to extract numeric values or default to 0
    const getNum = (val: any) => parseFloat(val) || 0;

    return {
      presence: {
        totalPresence: getNum(presenceSheet.data['% Présence']),
        totalAbsence: getNum(presenceSheet.data['Total Absences']),
        note: getNum(presenceSheet.data['Notes sur 20']),
        dates: Object.keys(presenceSheet.data)
          .filter(k => k.match(/^\d{2}\/\d{2}$/) || k === '24-26/04')
          .map(k => ({ date: k, status: presenceSheet.data[k] === 'P' ? 'P' : 'A' }))
      },
      rapports: {
        rendus: getNum(rapportsSheet.data['% Compte reçu']),
        nonRendus: getNum(rapportsSheet.data['Total Compte Non']),
        note: getNum(rapportsSheet.data['Notes sur 20']),
        dates: Object.keys(rapportsSheet.data)
          .filter(k => k.match(/^\d{2}\/\d{2}$/) || k === '24-26/04')
          .map(k => ({ date: k, status: rapportsSheet.data[k] === 'Fait' || rapportsSheet.data[k] === 'Rendu' ? 'Rendu' : 'Non Rendu' }))
      },
      global: {
        notePresence: getNum(recapSheet.data['Préseance au cours']),
        noteRapport: getNum(recapSheet.data['Compte rendu']),
        moyenneCours: getNum(recapSheet.data['Moyenne Cours']),
        admisEvaluations: recapSheet.data['Admis pour évaluation'] === 'OUI',
        evalEcrite: getNum(recapSheet.data['Evaluation Ecrite']),
        evalOrale: getNum(recapSheet.data['Evaluation Orale']),
        decisionJury: recapSheet.data['Statut'] || 'PENDING',
        observation: recapSheet.data['Observation'] || null,
        codeAttestation: recapSheet.data['Code Attestation'] || recapSheet.data['codeAttestation'] || null
      }
    };
  }

  async create(createLearnerDto: CreateLearnerDto) {
    try {
      return await this.prisma.learner.create({
        data: {
          ...createLearnerDto,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          identifiant: true,
          email: true,
          role: true,
          status: true,
          institutionId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Cet email est déjà utilisé par un autre apprenant');
        }
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<Learner | null> {
    return this.prisma.learner.findUnique({
      where: { email },
    });
  }

  findAll() {
    return this.prisma.learner.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const learner = await this.prisma.learner.findUnique({
      where: { id },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with id "${id}" not found`);
    }

    return learner;
  }

  async update(id: string, updateLearnerDto: UpdateLearnerDto) {
    await this.findOne(id);

    return this.prisma.learner.update({
      where: { id },
      data: updateLearnerDto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.learner.delete({
      where: { id },
    });
  }
}
