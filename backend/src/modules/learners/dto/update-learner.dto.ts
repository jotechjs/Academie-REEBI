import { LearnerStatus } from '@prisma/client';
import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength, IsNumber, IsBoolean } from 'class-validator';

export class UpdateLearnerDto {
  @IsOptional()
  @IsUUID('4')
  institutionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  identifiant?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  moyenneCours?: number;

  @IsOptional()
  @IsNumber()
  moyenne_ecrit?: number;

  @IsOptional()
  @IsNumber()
  eval_oral?: number;

  @IsOptional()
  @IsNumber()
  moyenneGenerale?: number;

  @IsOptional()
  @IsString()
  decisionJury?: string;
}
