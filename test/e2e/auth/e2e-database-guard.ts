const SAFE_DATABASE_NAME_PATTERN = /test/i;

function normalizePostgresUrl(url: string): string {
  return url.replace(/^postgres(ql)?:/, 'postgresql:');
}

function parseDatabaseName(url: string): string {
  const parsed = new URL(normalizePostgresUrl(url));
  const rawName = parsed.pathname.replace(/^\//, '').split('?')[0] ?? '';
  return decodeURIComponent(rawName);
}

export function assertSafeE2eDatabaseUrl(url: string): void {
  let databaseName: string;

  try {
    databaseName = parseDatabaseName(url);
  } catch {
    throw new Error(
      'E2E_DATABASE_URL must be a valid PostgreSQL connection URL',
    );
  }

  if (!databaseName || !SAFE_DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new Error(
      `Refusing auth e2e against database "${databaseName || '(empty)'}". ` +
        'E2E_DATABASE_URL must point to a dedicated test database whose name contains "test" (e.g. penielvault_test). ' +
        'Do not use your development or production DATABASE_URL.',
    );
  }
}

export function resolveE2eDatabaseUrl(): string {
  const e2eDatabaseUrl = process.env.E2E_DATABASE_URL?.trim();
  if (!e2eDatabaseUrl) {
    throw new Error(
      'E2E_DATABASE_URL is required for auth integration e2e (test:e2e:auth). ' +
        'Set it to a dedicated local test Postgres URL. bun run check skips auth e2e when E2E_DATABASE_URL is unset.',
    );
  }

  assertSafeE2eDatabaseUrl(e2eDatabaseUrl);
  return e2eDatabaseUrl;
}
