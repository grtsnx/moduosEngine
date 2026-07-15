import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { WorkerModule } from './worker.module';

export async function bootstrapWorker(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log', 'fatal'],
  });

  app.enableShutdownHooks();
  app.useLogger(app.get(Logger));

  const logger = app.get(Logger);
  logger.log('Email worker started');
}
