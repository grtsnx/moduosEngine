import { buildTestAuth } from 'src/lib/betterauth/testing/auth-test';
import { testUtils } from 'better-auth/plugins';
import {
  getLastBetterAuthConfig,
  resetLastBetterAuthConfig,
} from 'test/mocks/better-auth.mock';

describe('buildTestAuth', () => {
  beforeEach(() => {
    resetLastBetterAuthConfig();
    process.env.NODE_ENV = 'test';
    process.env.BETTER_AUTH_SECRET = 'test-secret-minimum-32-characters-long';
  });

  it('returns auth with testUtils plugin via extraPlugins', () => {
    const prisma = {} as Parameters<typeof buildTestAuth>[0];
    const auth = buildTestAuth(prisma, { captureOTP: true });

    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe('function');

    const plugins = (getLastBetterAuthConfig()?.plugins ?? []) as Array<{
      id: string;
      options?: { captureOTP?: boolean };
    }>;
    const testUtilsPlugin = plugins.find(
      (plugin) => plugin.id === 'test-utils',
    );
    expect(testUtilsPlugin?.options).toMatchObject({ captureOTP: true });
  });

  it('registers testUtils with captureOTP enabled by default', () => {
    const prisma = {} as Parameters<typeof buildTestAuth>[0];
    buildTestAuth(prisma);

    const plugins = (getLastBetterAuthConfig()?.plugins ?? []) as Array<{
      id: string;
      options?: { captureOTP?: boolean };
    }>;
    expect(plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-utils',
          options: { captureOTP: true },
        }),
      ]),
    );
    expect(testUtils).toBeDefined();
  });
});
