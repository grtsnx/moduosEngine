import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from 'src/app';
import {
  configureApp,
  isApiDocsEnabled,
  setupApiDocs,
  validateEnvOrExit,
} from 'src/middleware';

validateEnvOrExit();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: ['error', 'warn', 'fatal'],
  });

  const config = configureApp(app);
  await setupApiDocs(app, config);
  const port = config.PORT;

  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  const logger = app.get(Logger);
  logger.log(`Server running at ${baseUrl}`);

  if (isApiDocsEnabled(config)) {
    logger.log(`Swagger UI: ${baseUrl}/v1/docs`);
    logger.log(`Scalar API Reference: ${baseUrl}/v1/api-reference`);
  } else {
    logger.log('API documentation endpoints disabled.');
  }
}

process.on('unhandledRejection', (reason) => {
  const message =
    reason instanceof Error
      ? (reason.stack ?? reason.message)
      : JSON.stringify(reason);
  console.error('[UnhandledRejection]', message);
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err.stack ?? err.message);
  process.exit(1);
});

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[Bootstrap Error] ${message}`);
  process.exit(1);
});
