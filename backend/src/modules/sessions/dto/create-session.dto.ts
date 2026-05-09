import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsUUID('4')
  institutionId?: string;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
