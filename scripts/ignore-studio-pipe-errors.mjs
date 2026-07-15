/**
 * Preload for `prisma studio` under Bun.
 *
 * Prisma Studio's HTTP server pipes responses to the client socket. When the
 * browser closes a connection mid-response (tab refresh, cancelled request,
 * keepalive teardown), the pipe target is already destroyed and Node throws
 * `ERR_STREAM_UNABLE_TO_PIPE`. Under Node this is swallowed; under Bun the
 * abort semantics differ and it surfaces as a noisy (but harmless) crash log.
 *
 * This handler drops ONLY that benign error and preserves fail-fast behavior
 * for everything else. Scoped to the studio script — not loaded by the app.
 */
const IGNORABLE_CODE = 'ERR_STREAM_UNABLE_TO_PIPE';

function isIgnorablePipeError(error) {
  return (
    typeof error === 'object' && error !== null && error.code === IGNORABLE_CODE
  );
}

process.on('uncaughtException', (error) => {
  if (isIgnorablePipeError(error)) {
    return;
  }
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  if (isIgnorablePipeError(reason)) {
    return;
  }
  console.error(reason);
  process.exit(1);
});
