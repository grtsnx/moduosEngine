import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { SendMailsModule } from 'src/lib/email/sendMail.module';

import { validateEnv } from '../config/env.validation';
import { EmailWorkerModule } from '../queue/email-worker.module';

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
              singleLine: false,
            },
          },
        }),
      },
    }),
    SendMailsModule,
    EmailWorkerModule,
  ],
})
export class WorkerModule {}
