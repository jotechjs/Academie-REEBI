import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Le code d\'accès est obligatoire.' })
  accessCode: string;
}
