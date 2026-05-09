import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LearnersService } from '../learners/learners.service';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly learnersService: LearnersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, identifiant } = loginDto;
    const learner = await this.learnersService.findByEmail(email);

    if (!learner) {
      throw new UnauthorizedException('Compte non trouvé.');
    }

    if (learner.role === 'LEARNER' && learner.identifiant !== identifiant) {
      throw new UnauthorizedException('Identifiant incorrect.');
    }
    
    if (learner.role === 'ADMIN' && learner.identifiant && learner.identifiant !== identifiant) {
      throw new UnauthorizedException('Identifiant admin incorrect.');
    }

    const payload = { 
      sub: learner.id, 
      email: learner.email,
      role: learner.role,
      firstName: learner.firstName,
      lastName: learner.lastName 
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: learner.id,
        email: learner.email,
        firstName: learner.firstName,
        lastName: learner.lastName,
        role: learner.role,
      }
    };
  }

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const validCode = this.configService.get<string>('ADMIN_ACCESS_CODE') || 'REEBI2026';
    
    if (adminLoginDto.accessCode !== validCode) {
      throw new UnauthorizedException('Code d\'accès incorrect.');
    }

    const payload = {
      sub: 'admin-id',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Reebi'
    };

    return {
      access_token: await this.jwtService.signAsync(payload, { expiresIn: '8h' }),
      user: {
        id: 'admin-id',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'Reebi'
      }
    };
  }
}
