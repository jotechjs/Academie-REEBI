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
    
    const getNum = (val: any) => parseFloat(val) || 0;
    const getVal = (data: any, ...keys: string[]): any => {
      for (const key of keys) {
        if (data[key] !== undefined) return data[key];
      }
      return null;
    };

    const findSheetByKeys = (stats: Record<string, any>, ...keys: string[]) => {
      for (const key of keys) {
        if (stats[key]) return stats[key];
      }
      return { data: {} };
    };

    const presenceSheet = findSheetByKeys(stats, 'Presence_Globale', 'Présence Globale', 'Présence', 'Presence');
    const rapportsSheet = findSheetByKeys(stats, 'Contrôle cahiers', 'Controle cahier', 'Rapports', 'Contrôle_Cahiers');
    const recapSheet = findSheetByKeys(stats, 'Liste_Academiciens', 'Liste Academiciens', 'Liste Académiciens', 'Liste_des_Academiciens', 'Recap', 'Récapitulatif');

    const rawObservation = getVal(recapSheet.data, 'Observation', 'observation') || '';
    const normalizedObservation = rawObservation.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const admisEvalRaw = getVal(recapSheet.data, 'Admis pour évaluation', 'Admis pour evaluation', 'Admis pour évalue', 'Admis pour eval', 'Admis_Eval', 'Admis');
    const admisEvaluations = admisEvalRaw === 'OUI' || admisEvalRaw === 'yes' || admisEvalRaw === 'true' || String(admisEvalRaw).toUpperCase().trim() === 'OUI';

    return {
      presence: {
        totalPresence: getNum(getVal(presenceSheet.data, '% Présence', '% Presence', 'presence', 'Presence')),
        totalAbsence: getNum(getVal(presenceSheet.data, 'Total Absences', 'Total Absences', 'Absences', 'Absence')),
        note: getNum(getVal(presenceSheet.data, 'Notes sur 20', 'Notes', 'Note')),
        dates: Object.keys(presenceSheet.data)
          .filter(k => k.match(/^\d{2}\/\d{2}$/) || k === '24-26/04')
          .map(k => ({ date: k, status: presenceSheet.data[k] === 'P' ? 'P' : 'A' }))
      },
      rapports: {
        rendus: getNum(getVal(rapportsSheet.data, '% Compte reçu', '% Compte', 'Rendus', 'Rendu')),
        nonRendus: getNum(getVal(rapportsSheet.data, 'Total Compte Non', 'Non Rendus', 'Non')),
        note: getNum(getVal(rapportsSheet.data, 'Notes sur 20', 'Notes', 'Note')),
        dates: Object.keys(rapportsSheet.data)
          .filter(k => k.match(/^\d{2}\/\d{2}$/) || k === '24-26/04')
          .map(k => ({ date: k, status: rapportsSheet.data[k] === 'Fait' || rapportsSheet.data[k] === 'Rendu' ? 'Rendu' : 'Non Rendu' }))
      },
      global: {
        notePresence: getNum(getVal(recapSheet.data, 'Préseance au cours', 'Presence au cours', 'Presence', 'Presence_Cours')),
        noteRapport: getNum(getVal(recapSheet.data, 'Compte rendu', 'Compte_rendu', 'Rapport')),
        moyenneCours: getNum(getVal(recapSheet.data, 'Moyenne Cours', 'Moyenne_Cours', 'Moyenne', 'moyenne')),
        admisEvaluations: admisEvaluations,
        evalEcrite: getNum(getVal(recapSheet.data, 'Evaluation Ecrite', 'Evaluation_Ecrite', 'Ecrit', 'Ecrit')),
        evalOrale: getNum(getVal(recapSheet.data, 'Evaluation Orale', 'Evaluation_Oral', 'Orale', 'Oral')),
        decisionJury: getVal(recapSheet.data, 'Statut', 'Decision', 'Decision Jury', 'Statut_Jury') || 'PENDING',
        observation: normalizedObservation,
        codeAttestation: getVal(recapSheet.data, 'Code Attestation', 'Code_Attestation', 'codeAttestation', 'Code') || null
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
          throw new ConflictException('Cet email est déjà utilisé par un autre académicien');
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
