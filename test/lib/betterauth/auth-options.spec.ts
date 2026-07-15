import { buildAuth } from 'src/lib/betterauth/core/auth-options';
import {
  handleExistingUserSignUp,
  registerAuthForExistingUserSignUp,
  resetAuthForExistingUserSignUp,
} from 'src/lib/betterauth/core/existing-user-signup';
import { testUtils } from 'better-auth/plugins';
import { CAPTCHA_PROTECTED_ENDPOINTS } from 'src/lib/betterauth/core/auth-env';
import {
  getLastBetterAuthConfig,
  resetLastBetterAuthConfig,
} from 'test/mocks/better-auth.mock';

describe('buildAuth', () => {
  beforeEach(() => {
    resetLastBetterAuthConfig();
    resetAuthForExistingUserSignUp();
    process.env.NODE_ENV = 'test';
    process.env.BETTER_AUTH_SECRET = 'test-secret-minimum-32-characters-long';
    delete process.env.TRUST_PROXY;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.BETTER_AUTH_API_KEY;
    delete process.env.BETTER_AUTH_API_URL;
    delete process.env.CAPTCHA_ENABLED;
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it('returns a betterAuth instance with configured plugins', () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];
    const auth = buildAuth(prisma);

    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe('function');
  });

  it('registers envelope hooks, security plugins, and optional redis storage', () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];
    const redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      increment: jest.fn(),
    };

    process.env.TRUST_PROXY = 'true';
    process.env.BETTER_AUTH_URL = 'https://example.ngrok-free.app';

    buildAuth(prisma, { redis: redis as never });
    const config = getLastBetterAuthConfig();

    expect(config?.hooks).toBeDefined();
    const databaseHooks = config?.databaseHooks as
      | {
          user?: {
            create?: {
              before?: unknown;
              after?: unknown;
            };
            update?: {
              before?: unknown;
              after?: unknown;
            };
          };
        }
      | undefined;
    expect(typeof databaseHooks?.user?.create?.before).toBe('function');
    expect(typeof databaseHooks?.user?.create?.after).toBe('function');
    expect(typeof databaseHooks?.user?.update?.before).toBe('function');
    expect(typeof databaseHooks?.user?.update?.after).toBe('function');
    expect(config?.secondaryStorage).toBeDefined();
    expect(config?.experimental).toEqual({ joins: true });
    expect(config?.user).toMatchObject({
      modelName: 'user',
      additionalFields: {
        firstName: { type: 'string', required: true, input: true },
        lastName: { type: 'string', required: true, input: true },
      },
    });
    expect(config?.account).toMatchObject({ modelName: 'account' });
    expect(config?.session).toMatchObject({
      modelName: 'session',
      storeSessionInDatabase: true,
    });
    expect(config?.rateLimit).toMatchObject({
      enabled: false,
      storage: 'secondary-storage',
      window: 60,
      max: 100,
    });
    expect(config?.advanced).toEqual({
      useSecureCookies: true,
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'],
      },
    });

    const plugins = (config?.plugins ?? []) as Array<{
      id: string;
      options?: Record<string, unknown>;
    }>;
    const twoFactorPlugin = plugins.find(
      (plugin) => plugin.id === 'two-factor',
    );
    const organizationPlugin = plugins.find(
      (plugin) => plugin.id === 'organization',
    );
    const emailOtpPlugin = plugins.find((plugin) => plugin.id === 'email-otp');

    expect(twoFactorPlugin?.options).toMatchObject({
      issuer: 'TestPlatform',
      twoFactorCookieMaxAge: 600,
      trustDeviceMaxAge: 2592000,
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 900,
      },
      otpOptions: {
        allowedAttempts: 5,
        storeOTP: 'hashed',
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: 'encrypted',
      },
    });
    expect(organizationPlugin?.options).toMatchObject({
      organizationLimit: 5,
      membershipLimit: 100,
      invitationLimit: 50,
      invitationExpiresIn: 172800,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,
      disableOrganizationDeletion: true,
      creatorRole: 'owner',
    });
    expect(emailOtpPlugin?.options).toMatchObject({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: 'hashed',
    });

    expect(config?.emailAndPassword).toMatchObject({
      minPasswordLength: 12,
      maxPasswordLength: 256,
      resetPasswordTokenExpiresIn: 1800,
      revokeSessionsOnPasswordReset: true,
      autoSignIn: false,
    });
    const emailAndPassword = config?.emailAndPassword as
      | {
          onExistingUserSignUp?: unknown;
          customSyntheticUser?: unknown;
        }
      | undefined;
    expect(typeof emailAndPassword?.onExistingUserSignUp).toBe('function');
    expect(typeof emailAndPassword?.customSyntheticUser).toBe('function');
    expect(config?.emailVerification).toMatchObject({
      autoSignInAfterVerification: true,
    });

    expect(config?.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'harmony-email' }),
        expect.objectContaining({ id: 'two-factor' }),
        expect.objectContaining({ id: 'organization' }),
        expect.objectContaining({ id: 'admin' }),
        expect.objectContaining({ id: 'bearer' }),
        expect.objectContaining({ id: 'email-otp' }),
        expect.objectContaining({ id: 'passkey' }),
        expect.objectContaining({ id: 'have-i-been-pwned' }),
        expect.objectContaining({ id: 'last-login-method' }),
      ]),
    );

    const hibpPlugin = plugins.find(
      (plugin) => plugin.id === 'have-i-been-pwned',
    );
    expect(hibpPlugin?.options).toMatchObject({
      enabled: false,
      customPasswordCompromisedMessage:
        'The password you entered has been compromised. Please choose a different password.',
    });

    const lastLoginPlugin = plugins.find(
      (plugin) => plugin.id === 'last-login-method',
    );
    expect(lastLoginPlugin?.options).toMatchObject({
      storeInDatabase: true,
    });
  });

  it('enables HIBP when NODE_ENV is production', () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];
    process.env.NODE_ENV = 'production';

    buildAuth(prisma);
    const plugins = (getLastBetterAuthConfig()?.plugins ?? []) as Array<{
      id: string;
      options?: { enabled?: boolean };
    }>;
    const hibpPlugin = plugins.find(
      (plugin) => plugin.id === 'have-i-been-pwned',
    );
    expect(hibpPlugin?.options?.enabled).toBe(true);
  });

  it('registers testUtils when passed via extraPlugins', () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];

    buildAuth(prisma, { extraPlugins: [testUtils({ captureOTP: true })] });
    const plugins = (getLastBetterAuthConfig()?.plugins ?? []) as Array<{
      id: string;
    }>;
    expect(plugins.some((plugin) => plugin?.id === 'test-utils')).toBe(true);
  });

  it('registers Better Auth infra plugins only when BETTER_AUTH_API_KEY is set', () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];

    buildAuth(prisma);
    let plugins = (getLastBetterAuthConfig()?.plugins ?? []) as Array<{
      id: string;
      options?: {
        apiKey?: string;
        apiUrl?: string;
        kvUrl?: string;
        identifyUrl?: string;
      };
    }>;
    expect(plugins.some((plugin) => plugin.id === 'dash')).toBe(false);
    expect(plugins.some((plugin) => plugin.id === 'sentinel')).toBe(false);

    process.env.BETTER_AUTH_API_KEY = 'better-auth-api-key';
    process.env.BETTER_AUTH_API_URL = 'https://infra.example.com';
    process.env.BETTER_AUTH_IDENTIFY_URL =
      'https://kv.better-auth.com/projects/test-project';
    buildAuth(prisma);
    plugins = (getLastBetterAuthConfig()?.plugins ?? []) as Array<{
      id: string;
      options?: {
        apiKey?: string;
        apiUrl?: string;
        kvUrl?: string;
        identifyUrl?: string;
      };
    }>;

    const dashPlugin = plugins.find((plugin) => plugin.id === 'dash');
    const sentinelPlugin = plugins.find((plugin) => plugin.id === 'sentinel');

    expect(dashPlugin?.options?.apiKey).toBe('better-auth-api-key');
    expect(sentinelPlugin?.options?.apiKey).toBe('better-auth-api-key');
    expect(dashPlugin?.options?.apiUrl).toBe('https://infra.example.com');
    expect(sentinelPlugin?.options?.apiUrl).toBe('https://infra.example.com');
    expect(dashPlugin?.options?.kvUrl).toBe(
      'https://kv.better-auth.com/projects/test-project',
    );
    expect(sentinelPlugin?.options?.identifyUrl).toBe(
      'https://kv.better-auth.com/projects/test-project',
    );
  });

  it('enables Better Auth experimental joins for Prisma performance', () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];

    buildAuth(prisma);
    expect(getLastBetterAuthConfig()?.experimental).toEqual({ joins: true });
  });

  it('registers Cloudflare Turnstile captcha only when CAPTCHA_ENABLED=true', () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];

    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
    buildAuth(prisma);
    let plugins = (getLastBetterAuthConfig()?.plugins ?? []) as Array<{
      id: string;
      options?: {
        provider?: string;
        secretKey?: string;
        endpoints?: string[];
      };
    }>;
    expect(plugins.some((plugin) => plugin.id === 'captcha')).toBe(false);

    process.env.CAPTCHA_ENABLED = 'true';
    buildAuth(prisma);
    plugins = (getLastBetterAuthConfig()?.plugins ?? []) as Array<{
      id: string;
      options?: {
        provider?: string;
        secretKey?: string;
        endpoints?: string[];
      };
    }>;

    const captchaPlugin = plugins.find((plugin) => plugin.id === 'captcha');
    expect(captchaPlugin?.options).toMatchObject({
      provider: 'cloudflare-turnstile',
      secretKey: 'turnstile-secret',
    });
    expect(captchaPlugin?.options?.endpoints).toEqual([
      ...CAPTCHA_PROTECTED_ENDPOINTS,
    ]);

    const captchaIndex = plugins.findIndex((plugin) => plugin.id === 'captcha');
    const passkeyIndex = plugins.findIndex((plugin) => plugin.id === 'passkey');
    expect(captchaIndex).toBeGreaterThan(passkeyIndex);
  });

  it('resends verification OTP when an unverified user signs up again', async () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];
    const auth = buildAuth(prisma);
    const sendVerificationOTP = jest.fn().mockResolvedValue({ success: true });
    registerAuthForExistingUserSignUp({
      api: { sendVerificationOTP },
    } as never);

    await handleExistingUserSignUp({
      email: 'user@example.com',
      emailVerified: false,
    });

    expect(sendVerificationOTP).toHaveBeenCalledWith({
      body: { email: 'user@example.com', type: 'email-verification' },
    });
    expect(auth).toBeDefined();
  });

  it('builds synthetic user shape for enumeration protection', () => {
    const prisma = {} as Parameters<typeof buildAuth>[0];
    buildAuth(prisma);
    const customSyntheticUser = (
      getLastBetterAuthConfig()?.emailAndPassword as {
        customSyntheticUser?: (params: {
          coreFields: Record<string, unknown>;
          additionalFields: Record<string, unknown>;
          id: string;
        }) => Record<string, unknown>;
      }
    ).customSyntheticUser;

    expect(customSyntheticUser).toBeDefined();

    const synthetic = customSyntheticUser!({
      coreFields: {
        name: 'Alex Example',
        email: 'alex@example.com',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      additionalFields: { firstName: 'Alex', lastName: 'Example' },
      id: 'user-id',
    });

    expect(synthetic).toMatchObject({
      name: 'Alex Example',
      email: 'alex@example.com',
      role: 'user',
      banned: false,
      twoFactorEnabled: false,
      firstName: 'Alex',
      lastName: 'Example',
      id: 'user-id',
    });
  });
});
