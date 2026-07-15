import {
  BetterAuthModule,
  runAuthSchemaStartupChecks,
  runDashStartupChecks,
} from 'src/lib';
import {
  getLastForRootAsyncOptions,
  resetLastForRootAsyncOptions,
} from 'test/mocks/nestjs-better-auth.mock';

jest.mock('src/lib/betterauth/startup/auth-schema-startup-checks', () => ({
  runAuthSchemaStartupChecks: jest.fn(),
}));

jest.mock('src/lib/betterauth/startup/dash-startup-checks', () => ({
  runDashStartupChecks: jest.fn(),
}));

describe('BetterAuthModule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://test:test@localhost:5432/penielvault';
    resetLastForRootAsyncOptions();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('fails auth factory creation when auth schema startup checks fail', async () => {
    (runAuthSchemaStartupChecks as jest.Mock).mockRejectedValue(
      new Error('auth schema drift detected'),
    );

    BetterAuthModule.register();
    const asyncOptions = getLastForRootAsyncOptions() as {
      useFactory: (...args: unknown[]) => Promise<{ auth: unknown }>;
    };

    expect(asyncOptions).toBeDefined();

    const prismaService = {
      client: jest.fn(() => ({})),
    };
    const redisService = {
      isEnabled: jest.fn(() => false),
      getRawClient: jest.fn(),
    };

    await expect(
      asyncOptions.useFactory(prismaService, redisService),
    ).rejects.toThrow('auth schema drift detected');
  });

  it('fails auth factory creation when dash startup checks fail', async () => {
    (runAuthSchemaStartupChecks as jest.Mock).mockResolvedValue(undefined);
    (runDashStartupChecks as jest.Mock).mockRejectedValue(
      new Error('dash schema drift detected'),
    );

    BetterAuthModule.register();
    const asyncOptions = getLastForRootAsyncOptions() as {
      useFactory: (...args: unknown[]) => Promise<{ auth: unknown }>;
    };

    expect(asyncOptions).toBeDefined();

    const prismaService = {
      client: jest.fn(() => ({})),
    };
    const redisService = {
      isEnabled: jest.fn(() => false),
      getRawClient: jest.fn(),
    };

    await expect(
      asyncOptions.useFactory(prismaService, redisService),
    ).rejects.toThrow('dash schema drift detected');
  });

  it('builds auth when startup checks pass', async () => {
    (runAuthSchemaStartupChecks as jest.Mock).mockResolvedValue(undefined);
    (runDashStartupChecks as jest.Mock).mockResolvedValue(undefined);

    BetterAuthModule.register();
    const asyncOptions = getLastForRootAsyncOptions() as {
      useFactory: (...args: unknown[]) => Promise<{ auth: unknown }>;
    };

    const prismaService = {
      client: jest.fn(() => ({})),
    };
    const redisService = {
      isEnabled: jest.fn(() => false),
      getRawClient: jest.fn(),
    };

    const result = await asyncOptions.useFactory(prismaService, redisService);

    expect(runAuthSchemaStartupChecks).toHaveBeenCalledTimes(1);
    expect(runDashStartupChecks).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('auth');
    expect(typeof result.auth).toBe('object');
  });
});
