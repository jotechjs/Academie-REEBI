import { Module } from '@nestjs/common';
import { LearnersController } from './learners.controller';
import { LearnersService } from './learners.service';
import { CertificateService } from './certificate.service';

import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SessionsModule],
  controllers: [LearnersController],
  providers: [LearnersService, CertificateService],
  exports: [LearnersService],
})
export class LearnersModule {}
