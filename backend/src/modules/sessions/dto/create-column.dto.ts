import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  name!: string;

  @IsString()
  dataType!: string;

  @IsOptional()
  @IsInt()
  position?: number;
}