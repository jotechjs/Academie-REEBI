import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { LearnersModule } from './modules/learners/learners.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExperiencesModule } from './modules/experiences/experiences.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 5,
    }]),
    AppConfigModule,
    PrismaModule,
    HealthModule,
    LearnersModule,
    SessionsModule,
    AuthModule,
    ExperiencesModule,
  ],
})
export class AppModule {}
