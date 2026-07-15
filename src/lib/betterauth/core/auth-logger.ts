type BetterAuthLogLevel = 'debug' | 'info' | 'warn' | 'error';

let lastErrorKey = '';
let lastErrorAt = 0;

export function resetBetterAuthLoggerStateForTests(): void {
  lastErrorKey = '';
  lastErrorAt = 0;
}

function extractErrorSummary(error: Error): string {
  const lines = error.message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const unknownArgument = lines.find((line) =>
    line.startsWith('Unknown argument'),
  );
  if (unknownArgument) {
    return unknownArgument;
  }

  const columnMissing = lines.find(
    (line) =>
      line.includes('does not exist') ||
      line.includes('column "firstName"') ||
      line.includes('column "lastName"'),
  );
  if (columnMissing) {
    return columnMissing;
  }

  const firstLine = lines[0];
  if (firstLine && !firstLine.startsWith('Invalid `')) {
    return firstLine;
  }

  return lines.at(-1) ?? error.message;
}

function summarizeBetterAuthLog(message: string, args: unknown[]): string {
  const error = args.find((arg): arg is Error => arg instanceof Error);
  if (error) {
    const summary = extractErrorSummary(error);
    return summary ? `${message}: ${summary}` : message;
  }

  if (args.length === 0) {
    return message;
  }

  const first = args[0];
  if (typeof first === 'string') {
    return `${message} ${first}`.trim();
  }

  return message;
}

function shouldSkipDuplicateError(summary: string): boolean {
  const now = Date.now();
  if (summary === lastErrorKey && now - lastErrorAt < 250) {
    return true;
  }

  lastErrorKey = summary;
  lastErrorAt = now;
  return false;
}

function isDebugLoggingEnabled(): boolean {
  return process.env.BETTER_AUTH_DEBUG_LOGS?.trim().toLowerCase() === 'true';
}

export function buildBetterAuthLogger() {
  const debugLogs = isDebugLoggingEnabled();

  return {
    level: debugLogs ? ('warn' as const) : ('error' as const),
    log(level: BetterAuthLogLevel, message: string, ...args: unknown[]) {
      if (level === 'warn' && debugLogs) {
        console.error(
          `[Better Auth][warn] ${summarizeBetterAuthLog(message, args)}`,
        );
        return;
      }

      if (level !== 'error') {
        return;
      }

      const summary = summarizeBetterAuthLog(message, args);
      if (shouldSkipDuplicateError(summary)) {
        return;
      }

      console.error(`[Better Auth] ${summary}`);
    },
  };
}
