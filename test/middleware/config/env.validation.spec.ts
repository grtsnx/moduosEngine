import { validateEnv, validateEnvOrExit } from 'src/middleware';

import {
  invalidEnvInputs,
  productionEnvConfig,
  testEnvConfig,
  testNodeEnvDefaults,
} from 'test/fixtures';

describe('validateEnv', () => {
  it('returns validated config with defaults for development', () => {
    expect(validateEnv({ PLATFORM_SUPPORT: 'noreply@example.com' })).toEqual(
      testEnvConfig,
    );
  });

  it('requires URLs in production', () => {
    expect(() => validateEnv(invalidEnvInputs.productionMissingDevUrl)).toThrow(
      'DEVELOPMENT_URL is required when NODE_ENV=production',
    );
  });

  it('defaults ENABLE_API_DOCS to false in production', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      PRODUCTION_URL: productionEnvConfig.PRODUCTION_URL,
      DEVELOPMENT_URL: productionEnvConfig.DEVELOPMENT_URL,
      PLATFORM_URL: productionEnvConfig.PLATFORM_URL,
      PLATFORM_NAME: productionEnvConfig.PLATFORM_NAME,
      REDIS_URL: productionEnvConfig.REDIS_URL,
      DATABASE_URL: productionEnvConfig.DATABASE_URL,
      EMAIL_PROVIDER: productionEnvConfig.EMAIL_PROVIDER,
      SMTP_HOST: productionEnvConfig.SMTP_HOST,
      SMTP_USER: productionEnvConfig.SMTP_USER,
      SMTP_PASS: productionEnvConfig.SMTP_PASS,
      PLATFORM_SUPPORT: productionEnvConfig.PLATFORM_SUPPORT,
      BETTER_AUTH_SECRET: productionEnvConfig.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: productionEnvConfig.BETTER_AUTH_URL,
    });

    expect(config.ENABLE_API_DOCS).toBe('false');
  });

  it('rejects invalid NODE_ENV', () => {
    expect(() => validateEnv(invalidEnvInputs.stagingNodeEnv)).toThrow(
      'NODE_ENV must be one of',
    );
  });

  it('rejects invalid PORT', () => {
    expect(() => validateEnv(invalidEnvInputs.invalidPort)).toThrow(
      'PORT must be a valid port number',
    );
  });

  it('requires all production URLs', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        PRODUCTION_URL: productionEnvConfig.PRODUCTION_URL,
        DEVELOPMENT_URL: productionEnvConfig.DEVELOPMENT_URL,
      }),
    ).toThrow('PLATFORM_URL is required when NODE_ENV=production');
  });

  it('requires PLATFORM_NAME in production', () => {
    expect(() =>
      validateEnv(invalidEnvInputs.productionMissingPlatformName),
    ).toThrow('PLATFORM_NAME is required when NODE_ENV=production');
  });

  it('requires REDIS_URL in production', () => {
    expect(() => validateEnv(invalidEnvInputs.productionMissingRedis)).toThrow(
      'REDIS_URL is required when NODE_ENV=production',
    );
  });

  it('requires DATABASE_URL in production', () => {
    expect(() =>
      validateEnv(invalidEnvInputs.productionMissingDatabase),
    ).toThrow('DATABASE_URL is required when NODE_ENV=production');
  });

  it('rejects test email provider in production', () => {
    expect(() =>
      validateEnv(invalidEnvInputs.productionTestEmailProvider),
    ).toThrow('EMAIL_PROVIDER must not be "test" when NODE_ENV=production');
  });

  it('accepts explicit ENABLE_API_DOCS in production', () => {
    const config = validateEnv({
      ...productionEnvConfig,
      ENABLE_API_DOCS: 'true',
    });

    expect(config.ENABLE_API_DOCS).toBe('true');
  });

  it('rejects invalid LOG_LEVEL', () => {
    expect(() => validateEnv({ LOG_LEVEL: 'verbose' })).toThrow(
      'LOG_LEVEL must be one of',
    );
  });

  it('trims CORS_ORIGINS', () => {
    expect(
      validateEnv({
        PLATFORM_SUPPORT: 'noreply@example.com',
        CORS_ORIGINS: ' https://a.com , https://b.com ',
      }).CORS_ORIGINS,
    ).toBe('https://a.com , https://b.com');
  });

  it('rejects invalid EMAIL_PROVIDER', () => {
    expect(() => validateEnv(invalidEnvInputs.invalidEmailProvider)).toThrow(
      'EMAIL_PROVIDER must be one of',
    );
  });

  it('rejects invalid TRUST_PROXY', () => {
    expect(() => validateEnv(invalidEnvInputs.invalidTrustProxy)).toThrow(
      'TRUST_PROXY must be a boolean or a non-negative integer',
    );
  });

  it('parses TRUST_PROXY numeric values', () => {
    const config = validateEnv({
      PLATFORM_SUPPORT: 'noreply@example.com',
      TRUST_PROXY: '2',
    });

    expect(config.TRUST_PROXY).toBe(2);
  });

  it('requires google credentials when EMAIL_PROVIDER=google', () => {
    expect(() =>
      validateEnv({ EMAIL_PROVIDER: 'google', PLATFORM_SUPPORT: 'a@b.com' }),
    ).toThrow('EMAIL_ADDRESS and EMAIL_PASSWORD are required');
  });

  it('requires smtp credentials when EMAIL_PROVIDER=smtp', () => {
    expect(() =>
      validateEnv({ EMAIL_PROVIDER: 'smtp', PLATFORM_SUPPORT: 'a@b.com' }),
    ).toThrow('SMTP_HOST, SMTP_USER, and SMTP_PASS are required');
  });

  it('defaults SMTP_PORT to 587', () => {
    const config = validateEnv({
      EMAIL_PROVIDER: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
      PLATFORM_SUPPORT: 'noreply@example.com',
    });

    expect(config.SMTP_PORT).toBe(587);
  });

  it('rejects invalid SMTP_PORT', () => {
    expect(() => validateEnv(invalidEnvInputs.invalidSmtpPort)).toThrow(
      'SMTP_PORT must be a valid port number between 1 and 65535',
    );
  });

  it('defaults email vars for NODE_ENV=test', () => {
    const config = validateEnv({ NODE_ENV: 'test' });

    expect(config.EMAIL_PROVIDER).toBe(testNodeEnvDefaults.EMAIL_PROVIDER);
    expect(config.PLATFORM_NAME).toBe(testNodeEnvDefaults.PLATFORM_NAME);
    expect(config.PLATFORM_SUPPORT).toBe(testNodeEnvDefaults.PLATFORM_SUPPORT);
  });

  it('rejects empty PLATFORM_SUPPORT', () => {
    expect(() => validateEnv(invalidEnvInputs.emptyPlatformSupport)).toThrow(
      'PLATFORM_SUPPORT is required for email configuration',
    );
  });

  it('rejects partial google credentials', () => {
    expect(() => validateEnv(invalidEnvInputs.googleMissingPassword)).toThrow(
      'EMAIL_ADDRESS and EMAIL_PASSWORD are required when EMAIL_PROVIDER=google',
    );
  });

  it('rejects partial smtp credentials', () => {
    expect(() => validateEnv(invalidEnvInputs.smtpMissingHost)).toThrow(
      'SMTP_HOST, SMTP_USER, and SMTP_PASS are required when EMAIL_PROVIDER=smtp',
    );
  });

  it('defaults rate limit values', () => {
    const config = validateEnv({ PLATFORM_SUPPORT: 'noreply@example.com' });

    expect(config.RATE_LIMIT_TTL).toBe(60000);
    expect(config.RATE_LIMIT_MAX).toBe(30);
  });

  it('rejects invalid RATE_LIMIT_TTL', () => {
    expect(() =>
      validateEnv({
        ...invalidEnvInputs.invalidRateLimitTtl,
        PLATFORM_SUPPORT: 'noreply@example.com',
      }),
    ).toThrow('RATE_LIMIT_TTL must be an integer >= 1000');
  });

  it('rejects invalid RATE_LIMIT_MAX', () => {
    expect(() =>
      validateEnv({
        ...invalidEnvInputs.invalidRateLimitMax,
        PLATFORM_SUPPORT: 'noreply@example.com',
      }),
    ).toThrow('RATE_LIMIT_MAX must be a positive integer');
  });

  it('rejects invalid BETTER_AUTH_RATE_LIMIT_WINDOW', () => {
    expect(() =>
      validateEnv({
        ...invalidEnvInputs.invalidBetterAuthRateLimitWindow,
        PLATFORM_SUPPORT: 'noreply@example.com',
      }),
    ).toThrow('BETTER_AUTH_RATE_LIMIT_WINDOW must be a positive integer');
  });

  it('rejects invalid BETTER_AUTH_RATE_LIMIT_MAX', () => {
    expect(() =>
      validateEnv({
        ...invalidEnvInputs.invalidBetterAuthRateLimitMax,
        PLATFORM_SUPPORT: 'noreply@example.com',
      }),
    ).toThrow('BETTER_AUTH_RATE_LIMIT_MAX must be a positive integer');
  });

  it('rejects wildcard CORS origins', () => {
    expect(() => validateEnv(invalidEnvInputs.corsWildcard)).toThrow(
      'CORS_ORIGINS must not contain "*" when credentials are enabled',
    );
  });

  it('requires HTTPS in production CORS_ORIGINS values', () => {
    expect(() =>
      validateEnv(invalidEnvInputs.productionInsecureCorsOrigin),
    ).toThrow('CORS_ORIGINS must use HTTPS values when NODE_ENV=production');
  });

  it('requires HTTPS BETTER_AUTH_URL in production', () => {
    expect(() =>
      validateEnv(invalidEnvInputs.productionInsecureBetterAuthUrl),
    ).toThrow('BETTER_AUTH_URL must use HTTPS when NODE_ENV=production');
  });

  it('rejects invalid BETTER_AUTH_API_URL', () => {
    expect(() => validateEnv(invalidEnvInputs.invalidBetterAuthApiUrl)).toThrow(
      'BETTER_AUTH_API_URL must be a valid absolute URL',
    );
  });

  it('rejects invalid BETTER_AUTH_IDENTIFY_URL', () => {
    expect(() =>
      validateEnv(invalidEnvInputs.invalidBetterAuthIdentifyUrl),
    ).toThrow('BETTER_AUTH_IDENTIFY_URL must be a valid absolute URL');
  });

  it('accepts valid BETTER_AUTH_IDENTIFY_URL', () => {
    const config = validateEnv({
      PLATFORM_SUPPORT: 'noreply@example.com',
      BETTER_AUTH_IDENTIFY_URL:
        'https://kv.better-auth.com/projects/test-project',
    });

    expect(config.BETTER_AUTH_IDENTIFY_URL).toBe(
      'https://kv.better-auth.com/projects/test-project',
    );
  });

  it('accepts explicit BETTER_AUTH toggles', () => {
    const config = validateEnv({
      PLATFORM_SUPPORT: 'noreply@example.com',
      BETTER_AUTH_DASH_STARTUP_CHECKS: 'false',
    });

    expect(config.BETTER_AUTH_DASH_STARTUP_CHECKS).toBe('false');
  });

  it('defaults captcha to disabled', () => {
    const config = validateEnv({
      PLATFORM_SUPPORT: 'noreply@example.com',
    });

    expect(config.CAPTCHA_ENABLED).toBe(false);
    expect(config.TURNSTILE_SECRET_KEY).toBe('');
  });

  it('requires TURNSTILE_SECRET_KEY when CAPTCHA_ENABLED=true', () => {
    expect(() =>
      validateEnv({
        PLATFORM_SUPPORT: 'noreply@example.com',
        CAPTCHA_ENABLED: 'true',
      }),
    ).toThrow('TURNSTILE_SECRET_KEY is required when CAPTCHA_ENABLED=true');
  });

  it('accepts captcha config when enabled with a Turnstile secret', () => {
    const config = validateEnv({
      PLATFORM_SUPPORT: 'noreply@example.com',
      CAPTCHA_ENABLED: 'true',
      TURNSTILE_SECRET_KEY: 'turnstile-secret',
    });

    expect(config.CAPTCHA_ENABLED).toBe(true);
    expect(config.TURNSTILE_SECRET_KEY).toBe('turnstile-secret');
  });

  it('allows captcha to stay disabled even when a Turnstile secret is set', () => {
    const config = validateEnv({
      PLATFORM_SUPPORT: 'noreply@example.com',
      CAPTCHA_ENABLED: 'false',
      TURNSTILE_SECRET_KEY: 'turnstile-secret',
    });

    expect(config.CAPTCHA_ENABLED).toBe(false);
    expect(config.TURNSTILE_SECRET_KEY).toBe('turnstile-secret');
  });

  it('rejects invalid CAPTCHA_ENABLED values', () => {
    expect(() =>
      validateEnv({
        PLATFORM_SUPPORT: 'noreply@example.com',
        CAPTCHA_ENABLED: 'maybe',
      }),
    ).toThrow(
      'CAPTCHA_ENABLED must be a boolean (true/false, 1/0, yes/no, on/off)',
    );
  });

  it('rejects test email provider when DATABASE_URL is set in development', () => {
    expect(() =>
      validateEnv(invalidEnvInputs.authEnabledTestEmailProvider),
    ).toThrow(
      'EMAIL_PROVIDER must not be "test" when DATABASE_URL is set; configure smtp or google with the required credentials',
    );
  });

  it('requires BETTER_AUTH_SECRET when DATABASE_URL is set in development', () => {
    expect(() =>
      validateEnv(invalidEnvInputs.authEnabledMissingSecret),
    ).toThrow(
      'BETTER_AUTH_SECRET must be at least 32 characters when DATABASE_URL is set',
    );
  });

  it('accepts smtp email config when DATABASE_URL is set in development', () => {
    const config = validateEnv({
      NODE_ENV: 'development',
      DATABASE_URL: productionEnvConfig.DATABASE_URL,
      PLATFORM_NAME: 'TestPlatform',
      PLATFORM_SUPPORT: 'noreply@example.com',
      EMAIL_PROVIDER: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
      BETTER_AUTH_SECRET: productionEnvConfig.BETTER_AUTH_SECRET,
    });

    expect(config.EMAIL_PROVIDER).toBe('smtp');
    expect(config.DATABASE_URL).toBe(productionEnvConfig.DATABASE_URL);
  });

  it('validateEnvOrExit prints a single message and exits on invalid config', () => {
    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as typeof process.exit);
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    validateEnvOrExit(invalidEnvInputs.authEnabledTestEmailProvider);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('EMAIL_PROVIDER must not be "test"'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
