import 'dotenv/config';

import { validateEnvOrExit } from 'src/middleware';

import { bootstrapWorker } from './bootstrap-worker';

validateEnvOrExit();

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

bootstrapWorker().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[Worker Bootstrap Error] ${message}`);
  process.exit(1);
});
