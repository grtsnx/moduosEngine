import {
  assertSafeE2eDatabaseUrl,
  resolveE2eDatabaseUrl,
} from './e2e-database-guard';

describe('e2e-database-guard', () => {
  const originalE2eDatabaseUrl = process.env.E2E_DATABASE_URL;

  afterEach(() => {
    if (originalE2eDatabaseUrl === undefined) {
      delete process.env.E2E_DATABASE_URL;
    } else {
      process.env.E2E_DATABASE_URL = originalE2eDatabaseUrl;
    }
  });

  it('accepts database names containing test', () => {
    expect(() =>
      assertSafeE2eDatabaseUrl(
        'postgresql://user:pass@localhost:5432/penielvault_test',
      ),
    ).not.toThrow();
  });

  it('rejects production-like database names', () => {
    expect(() =>
      assertSafeE2eDatabaseUrl(
        'postgresql://user:pass@localhost:5432/penielvault',
      ),
    ).toThrow(/Refusing auth e2e against database "penielvault"/);
  });

  it('requires E2E_DATABASE_URL', () => {
    delete process.env.E2E_DATABASE_URL;

    expect(() => resolveE2eDatabaseUrl()).toThrow(
      /E2E_DATABASE_URL is required/,
    );
  });

  it('returns validated E2E_DATABASE_URL', () => {
    process.env.E2E_DATABASE_URL =
      'postgresql://test:test@localhost:5432/penielvault_test';

    expect(resolveE2eDatabaseUrl()).toBe(process.env.E2E_DATABASE_URL);
  });
});
