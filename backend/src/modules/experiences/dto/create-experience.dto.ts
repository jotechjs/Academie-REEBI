import { IsString, IsNotEmpty } from 'class-validator';

export class CreateExperienceDto {
  @IsString()
  @IsNotEmpty()
  answer1!: string;

  @IsString()
  @IsNotEmpty()
  answer2!: string;

  @IsString()
  @IsNotEmpty()
  answer3!: string;
}
