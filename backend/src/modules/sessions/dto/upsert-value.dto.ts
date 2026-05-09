import { IsString, IsUUID, MaxLength } from 'class-validator';

export class UpsertValueDto {
  @IsUUID('4')
  learnerId!: string;

  @IsUUID('4')
  sessionColumnId!: string;

  @IsString()
  @MaxLength(10000)
  value!: string;
}
