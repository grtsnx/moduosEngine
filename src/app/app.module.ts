import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibModule } from 'src/lib/lib.module';
import { V1Module } from 'src/modules';
import {
  GlobalExceptionFilter,
  HealthModule,
  QueueModule,
  validateEnv,
} from 'src/middleware';

function getPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        ...(process.env.NODE_ENV !== 'production' && {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:HH:MM:ss',
              ignore:
                'pid,hostname,context,req,res,responseTime,service,environment',
              singleLine: false,
              messageFormat: '{msg}',
              hideObject: true,
            },
          },
        }),
        autoLogging: {
          ignore: (req) => {
            const url = req.url ?? '';
            return (
              url === '/health' ||
              url.startsWith('/health?') ||
              url === '/health/ready' ||
              url.startsWith('/health/ready?') ||
              url.includes('favicon.ico')
            );
          },
        },
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: getPositiveInt(config.get('RATE_LIMIT_TTL'), 60000),
            limit: getPositiveInt(config.get('RATE_LIMIT_MAX'), 30),
          },
        ],
      }),
    }),
    HealthModule,
    QueueModule,
    LibModule,
    V1Module,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useFactory: (configService: ConfigService) =>
        new GlobalExceptionFilter(
          configService.get<string>('NODE_ENV') === 'production',
        ),
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
