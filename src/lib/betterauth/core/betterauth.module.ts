import { DynamicModule, Module } from '@nestjs/common';
import { AuthModule as NestBetterAuthModule } from '@thallesp/nestjs-better-auth';
import type { Redis } from 'ioredis';

import { SendMailsModule } from '../../email/sendMail.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisModule } from '../../redis/redis.module';
import { RedisService } from '../../redis/redis.service';

import { runAuthSchemaStartupChecks } from '../startup/auth-schema-startup-checks';
import { runDashStartupChecks } from '../startup/dash-startup-checks';
import { buildAuth, type Auth } from './auth-options';

@Module({})
export class BetterAuthModule {
  static register(): DynamicModule {
    const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';

    if (!databaseUrl) {
      return { module: BetterAuthModule };
    }

    return {
      module: BetterAuthModule,
      imports: [
        PrismaModule,
        RedisModule,
        SendMailsModule,
        NestBetterAuthModule.forRootAsync({
          imports: [PrismaModule, RedisModule, SendMailsModule],
          inject: [PrismaService, RedisService],
          useFactory: (
            prismaService: PrismaService,
            redisService: RedisService,
          ): Promise<{ auth: Auth }> => {
            let redis: Redis | null = null;
            if (redisService.isEnabled()) {
              redis = redisService.getRawClient();
            }

            const prisma = prismaService.client();

            return runAuthSchemaStartupChecks(prisma)
              .then(() => runDashStartupChecks(prisma))
              .then(() => ({
                auth: buildAuth(prisma, { redis }),
              }));
          },
        }),
      ],
      exports: [NestBetterAuthModule],
    };
  }
}
