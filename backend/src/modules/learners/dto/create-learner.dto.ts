import { LearnerStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateLearnerDto {
  @IsOptional()
  @IsUUID('4')
  institutionId?: string;

  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identifiant?: string;


  @IsOptional()
  @IsEnum(LearnerStatus)
  status?: LearnerStatus;
}
