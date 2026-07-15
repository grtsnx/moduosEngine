import {
  buildAdvancedAuthOptions,
  buildIpAddressHeaders,
  buildBetterAuthRateLimit,
  buildTrustedOrigins,
  buildSocialProviders,
  CAPTCHA_PROTECTED_ENDPOINTS,
  isBetterAuthRateLimitEnabled,
  readBetterAuthApiUrl,
  readBetterAuthIdentifyUrl,
  readBackofficeSeedConfig,
  readTurnstileSecretKey,
  resolveAuthAppName,
  shouldEnableCaptcha,
  shouldEnableHibp,
  shouldRunDashStartupChecks,
  shouldRequireEmailVerification,
  shouldUseSecureCookies,
} from 'src/lib/betterauth/core/auth-env';
import { AUTH_BASE_PATH } from 'src/lib/betterauth/paths/auth-paths';

describe('auth-env security helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.BETTER_AUTH_SECRET = 'test-secret-minimum-32-characters-long';
    delete process.env.TRUST_PROXY;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.PLATFORM_URL;
    delete process.env.BACKOFFICE_ADMIN_EMAIL;
    delete process.env.BACKOFFICE_ADMIN_PASSWORD;
    delete process.env.BETTER_AUTH_DASH_STARTUP_CHECKS;
    delete process.env.BETTER_AUTH_API_KEY;
    delete process.env.BETTER_AUTH_API_URL;
    delete process.env.CAPTCHA_ENABLED;
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('builds trusted origins from env URLs', () => {
    process.env.PLATFORM_URL = 'http://localhost:3000';
    process.env.CORS_ORIGINS = 'https://app.example.com';

    expect(buildTrustedOrigins()).toEqual(
      expect.arrayContaining([
        'http://localhost:3000',
        'https://app.example.com',
      ]),
    );
  });

  it('normalizes trusted origins and excludes localhost defaults in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '3000';
    process.env.PRODUCTION_URL = 'https://api.example.com/v1';
    process.env.PLATFORM_URL = 'https://app.example.com/dashboard';
    process.env.CORS_ORIGINS =
      'https://app.example.com,https://admin.example.com';

    expect(buildTrustedOrigins()).toEqual([
      'https://api.example.com',
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('registers social providers only when credentials exist', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';

    const providers = buildSocialProviders();
    expect(providers.google).toEqual({
      clientId: 'google-id',
      clientSecret: 'google-secret',
    });
    expect(providers.github).toBeUndefined();
  });

  it('uses secure cookies when BETTER_AUTH_URL is HTTPS', () => {
    process.env.BETTER_AUTH_URL = 'https://example.ngrok-free.app';

    expect(shouldUseSecureCookies()).toBe(true);
  });

  it('does not use secure cookies for local HTTP in non-production', () => {
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';

    expect(shouldUseSecureCookies()).toBe(false);
  });

  it('returns hardcoded Better Auth IP headers', () => {
    expect(buildIpAddressHeaders()).toEqual([
      'cf-connecting-ip',
      'x-forwarded-for',
      'x-real-ip',
    ]);
  });

  it('builds advanced auth options with hardcoded IP headers', () => {
    process.env.BETTER_AUTH_URL = 'https://example.ngrok-free.app';

    expect(buildAdvancedAuthOptions()).toEqual({
      useSecureCookies: true,
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'],
      },
    });
  });

  it('returns null backoffice seed config when credentials are missing', () => {
    expect(readBackofficeSeedConfig()).toBeNull();
  });

  it('builds Better Auth rate-limit defaults', () => {
    expect(buildBetterAuthRateLimit()).toEqual({
      window: 60,
      max: 100,
    });
  });

  it('disables Better Auth rate-limit by default in test environment', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.BETTER_AUTH_RATE_LIMIT_ENABLED;

    expect(isBetterAuthRateLimitEnabled()).toBe(false);
  });

  it('honors explicit Better Auth rate-limit enabled override', () => {
    process.env.BETTER_AUTH_RATE_LIMIT_ENABLED = 'true';

    expect(isBetterAuthRateLimitEnabled()).toBe(true);
  });

  it('disables required email verification by default in test environment', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION;

    expect(shouldRequireEmailVerification()).toBe(false);
  });

  it('honors explicit required email verification override', () => {
    process.env.BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION = 'true';

    expect(shouldRequireEmailVerification()).toBe(true);
  });

  it('disables HIBP by default in test environment', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.BETTER_AUTH_HIBP_ENABLED;

    expect(shouldEnableHibp()).toBe(false);
  });

  it('enables HIBP in production by default', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BETTER_AUTH_HIBP_ENABLED;

    expect(shouldEnableHibp()).toBe(true);
  });

  it('honors explicit HIBP enabled override', () => {
    process.env.NODE_ENV = 'test';
    process.env.BETTER_AUTH_HIBP_ENABLED = 'true';

    expect(shouldEnableHibp()).toBe(true);
  });

  it('runs dash startup checks when API key is set by default', () => {
    process.env.BETTER_AUTH_API_KEY = 'dash-api-key';
    delete process.env.BETTER_AUTH_DASH_STARTUP_CHECKS;

    expect(shouldRunDashStartupChecks()).toBe(true);
  });

  it('allows explicit dash startup check override', () => {
    process.env.BETTER_AUTH_API_KEY = 'dash-api-key';
    process.env.BETTER_AUTH_DASH_STARTUP_CHECKS = 'false';

    expect(shouldRunDashStartupChecks()).toBe(false);
  });

  it('reads Better Auth API URL', () => {
    process.env.BETTER_AUTH_API_URL = 'https://api.infra.example.com';

    expect(readBetterAuthApiUrl()).toBe('https://api.infra.example.com');
  });

  it('builds Better Auth rate-limit overrides from env', () => {
    process.env.BETTER_AUTH_RATE_LIMIT_WINDOW = '120';
    process.env.BETTER_AUTH_RATE_LIMIT_MAX = '42';

    expect(buildBetterAuthRateLimit()).toEqual({
      window: 120,
      max: 42,
    });
  });

  it('resolves auth app name from PLATFORM_NAME with safe fallback', () => {
    delete process.env.PLATFORM_NAME;
    expect(resolveAuthAppName()).toBe('Platform');

    process.env.PLATFORM_NAME = 'PenielVault';
    expect(resolveAuthAppName()).toBe('PenielVault');
  });

  it('returns backoffice seed config when email and password are set', () => {
    process.env.BACKOFFICE_ADMIN_EMAIL = 'admin@example.com';
    process.env.BACKOFFICE_ADMIN_PASSWORD = 'secure-password';

    expect(readBackofficeSeedConfig()).toEqual({
      email: 'admin@example.com',
      password: 'secure-password',
      name: 'Backoffice Admin',
    });
  });

  it('reads Better Auth identify URL from env', () => {
    delete process.env.BETTER_AUTH_IDENTIFY_URL;
    expect(readBetterAuthIdentifyUrl()).toBe('');

    process.env.BETTER_AUTH_IDENTIFY_URL =
      'https://kv.better-auth.com/projects/test-project';
    expect(readBetterAuthIdentifyUrl()).toBe(
      'https://kv.better-auth.com/projects/test-project',
    );
  });

  it('keeps Cloudflare captcha disabled by default', () => {
    delete process.env.CAPTCHA_ENABLED;

    expect(shouldEnableCaptcha()).toBe(false);
  });

  it('honors explicit captcha disable values', () => {
    for (const value of ['false', '0', 'no', 'off']) {
      process.env.CAPTCHA_ENABLED = value;
      expect(shouldEnableCaptcha()).toBe(false);
    }
  });

  it('enables Cloudflare captcha when CAPTCHA_ENABLED=true', () => {
    for (const value of ['true', '1', 'yes', 'on']) {
      process.env.CAPTCHA_ENABLED = value;
      expect(shouldEnableCaptcha()).toBe(true);
    }
  });

  it('reads Turnstile secret key from env', () => {
    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';

    expect(readTurnstileSecretKey()).toBe('turnstile-secret');
  });

  it('defines the captcha-protected Better Auth endpoint list', () => {
    expect([...CAPTCHA_PROTECTED_ENDPOINTS]).toEqual([
      '/sign-up/email',
      '/sign-in/email',
      '/request-password-reset',
      '/email-otp/send-verification-otp',
      '/sign-in/email-otp',
      '/email-otp/request-password-reset',
      '/forget-password/email-otp',
    ]);
  });
});

describe('auth-paths', () => {
  it('exports versioned auth base path', () => {
    expect(AUTH_BASE_PATH).toBe('/v1/api/auth');
  });
});
