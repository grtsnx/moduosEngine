export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  TRUST_PROXY: boolean | number;
  PRODUCTION_URL: string;
  DEVELOPMENT_URL: string;
  PLATFORM_URL: string;
  PLATFORM_NAME: string;
  ENABLE_API_DOCS: string;
  LOG_LEVEL: string;
  CORS_ORIGINS: string;
  REDIS_URL: string;
  DATABASE_URL: string;
  EMAIL_PROVIDER: 'test' | 'google' | 'smtp';
  PLATFORM_SUPPORT: string;
  PLATFORM_LOGO_URL: string;
  COLOR_CODE: string;
  EMAIL_ADDRESS: string;
  EMAIL_PASSWORD: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  RATE_LIMIT_TTL: number;
  RATE_LIMIT_MAX: number;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_API_KEY: string;
  BETTER_AUTH_API_URL: string;
  BETTER_AUTH_IDENTIFY_URL: string;
  BETTER_AUTH_RATE_LIMIT_WINDOW: number;
  BETTER_AUTH_RATE_LIMIT_MAX: number;
  BETTER_AUTH_DASH_STARTUP_CHECKS: string;
  CAPTCHA_ENABLED: boolean;
  TURNSTILE_SECRET_KEY: string;
  BACKOFFICE_ADMIN_EMAIL: string;
  BACKOFFICE_ADMIN_PASSWORD: string;
  BACKOFFICE_ADMIN_NAME: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  APPLE_CLIENT_ID: string;
  APPLE_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  TWITTER_CLIENT_ID: string;
  TWITTER_CLIENT_SECRET: string;
}

const VALID_NODE_ENVS = ['development', 'production', 'test'] as const;
const VALID_LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
] as const;
const VALID_EMAIL_PROVIDERS = ['test', 'google', 'smtp'] as const;

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

function parseHttpUrl(value: string, fieldName: string): string {
  if (!value) {
    return value;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid absolute URL`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${fieldName} must use http or https`);
  }

  return value;
}

function parseTrustProxy(value: unknown): boolean | number {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0) {
      return value === 0 ? false : value;
    }
    throw new Error('TRUST_PROXY must be a boolean or a non-negative integer');
  }

  const raw = asString(value).trim().toLowerCase();

  if (!raw || raw === 'false' || raw === '0' || raw === 'no' || raw === 'off') {
    return false;
  }

  if (raw === 'true' || raw === 'yes' || raw === 'on') {
    return true;
  }

  const hops = Number(raw);
  if (Number.isInteger(hops) && hops >= 1) {
    return hops;
  }

  throw new Error('TRUST_PROXY must be a boolean or a non-negative integer');
}

function parseCorsOrigins(corsOrigins: string): string[] {
  if (!corsOrigins) {
    return [];
  }

  return corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseOptionalBooleanFlag(value: unknown, fieldName: string): boolean {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const raw = asString(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(raw)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(raw)) {
    return false;
  }

  throw new Error(
    `${fieldName} must be a boolean (true/false, 1/0, yes/no, on/off)`,
  );
}

function isNodeEnv(value: string): value is EnvConfig['NODE_ENV'] {
  return (VALID_NODE_ENVS as readonly string[]).includes(value);
}

function isEmailProvider(value: string): value is EnvConfig['EMAIL_PROVIDER'] {
  return (VALID_EMAIL_PROVIDERS as readonly string[]).includes(value);
}

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const nodeEnv = asString(config.NODE_ENV, 'development');

  if (!isNodeEnv(nodeEnv)) {
    throw new Error(`NODE_ENV must be one of: ${VALID_NODE_ENVS.join(', ')}`);
  }

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number between 1 and 65535');
  }
  const trustProxy = parseTrustProxy(config.TRUST_PROXY);

  const productionUrl = parseHttpUrl(
    asString(config.PRODUCTION_URL).trim(),
    'PRODUCTION_URL',
  );
  const developmentUrl = parseHttpUrl(
    asString(config.DEVELOPMENT_URL).trim(),
    'DEVELOPMENT_URL',
  );
  const platformUrl = parseHttpUrl(
    asString(config.PLATFORM_URL).trim(),
    'PLATFORM_URL',
  );
  const platformName = asString(
    config.PLATFORM_NAME,
    nodeEnv === 'test' ? 'TestPlatform' : '',
  ).trim();
  const corsOriginsRaw = asString(config.CORS_ORIGINS).trim();
  const corsOrigins = parseCorsOrigins(corsOriginsRaw);

  for (const origin of corsOrigins) {
    if (origin === '*') {
      throw new Error(
        'CORS_ORIGINS must not contain "*" when credentials are enabled',
      );
    }
    parseHttpUrl(origin, 'CORS_ORIGINS');
  }

  if (nodeEnv === 'production') {
    const insecureOrigin = corsOrigins.find(
      (origin) => !origin.toLowerCase().startsWith('https://'),
    );
    if (insecureOrigin) {
      throw new Error(
        'CORS_ORIGINS must use HTTPS values when NODE_ENV=production',
      );
    }
  }

  const rateLimitTtl = Number(config.RATE_LIMIT_TTL ?? 60000);
  if (!Number.isInteger(rateLimitTtl) || rateLimitTtl < 1000) {
    throw new Error('RATE_LIMIT_TTL must be an integer >= 1000 (milliseconds)');
  }

  const rateLimitMax = Number(config.RATE_LIMIT_MAX ?? 30);
  if (!Number.isInteger(rateLimitMax) || rateLimitMax < 1) {
    throw new Error('RATE_LIMIT_MAX must be a positive integer');
  }

  if (nodeEnv === 'production') {
    if (!productionUrl) {
      throw new Error('PRODUCTION_URL is required when NODE_ENV=production');
    }
    if (!developmentUrl) {
      throw new Error('DEVELOPMENT_URL is required when NODE_ENV=production');
    }
    if (!platformUrl) {
      throw new Error('PLATFORM_URL is required when NODE_ENV=production');
    }
    if (!platformName) {
      throw new Error('PLATFORM_NAME is required when NODE_ENV=production');
    }
  }

  const enableApiDocs =
    nodeEnv === 'production'
      ? asString(config.ENABLE_API_DOCS, 'false')
      : asString(config.ENABLE_API_DOCS, 'true');

  const logLevel = asString(config.LOG_LEVEL, 'info').toLowerCase();
  if (!(VALID_LOG_LEVELS as readonly string[]).includes(logLevel)) {
    throw new Error(`LOG_LEVEL must be one of: ${VALID_LOG_LEVELS.join(', ')}`);
  }

  const emailProviderRaw = asString(
    config.EMAIL_PROVIDER,
    nodeEnv === 'test' ? 'test' : 'test',
  ).toLowerCase();

  if (!isEmailProvider(emailProviderRaw)) {
    throw new Error(
      `EMAIL_PROVIDER must be one of: ${VALID_EMAIL_PROVIDERS.join(', ')}`,
    );
  }

  const platformSupport = asString(
    config.PLATFORM_SUPPORT,
    nodeEnv === 'test' ? 'noreply@test.local' : '',
  ).trim();

  if (!platformSupport) {
    throw new Error('PLATFORM_SUPPORT is required for email configuration');
  }

  const emailAddress = asString(config.EMAIL_ADDRESS).trim();
  const emailPassword = asString(config.EMAIL_PASSWORD).trim();
  const smtpHost = asString(config.SMTP_HOST).trim();
  const smtpPort = Number(config.SMTP_PORT ?? 587);
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw new Error(
      'SMTP_PORT must be a valid port number between 1 and 65535',
    );
  }
  const smtpUser = asString(config.SMTP_USER).trim();
  const smtpPass = asString(config.SMTP_PASS).trim();
  const redisUrl = asString(config.REDIS_URL).trim();
  const databaseUrl = asString(config.DATABASE_URL).trim();
  const betterAuthSecret = asString(config.BETTER_AUTH_SECRET).trim();
  const betterAuthUrl = parseHttpUrl(
    asString(config.BETTER_AUTH_URL).trim() ||
      asString(config.PLATFORM_URL).trim() ||
      `http://localhost:${port}`,
    'BETTER_AUTH_URL',
  );
  const betterAuthRateLimitWindow = Number(
    config.BETTER_AUTH_RATE_LIMIT_WINDOW ?? 60,
  );
  if (
    !Number.isInteger(betterAuthRateLimitWindow) ||
    betterAuthRateLimitWindow < 1
  ) {
    throw new Error(
      'BETTER_AUTH_RATE_LIMIT_WINDOW must be a positive integer (seconds)',
    );
  }
  const betterAuthRateLimitMax = Number(
    config.BETTER_AUTH_RATE_LIMIT_MAX ?? 100,
  );
  if (!Number.isInteger(betterAuthRateLimitMax) || betterAuthRateLimitMax < 1) {
    throw new Error('BETTER_AUTH_RATE_LIMIT_MAX must be a positive integer');
  }
  const betterAuthApiUrlRaw = asString(config.BETTER_AUTH_API_URL).trim();
  const betterAuthApiUrl = betterAuthApiUrlRaw
    ? parseHttpUrl(betterAuthApiUrlRaw, 'BETTER_AUTH_API_URL')
    : '';
  const betterAuthIdentifyUrlRaw = asString(
    config.BETTER_AUTH_IDENTIFY_URL,
  ).trim();
  const betterAuthIdentifyUrl = betterAuthIdentifyUrlRaw
    ? parseHttpUrl(betterAuthIdentifyUrlRaw, 'BETTER_AUTH_IDENTIFY_URL')
    : '';
  const betterAuthDashStartupChecks = asString(
    config.BETTER_AUTH_DASH_STARTUP_CHECKS,
  ).trim();
  const captchaEnabled = parseOptionalBooleanFlag(
    config.CAPTCHA_ENABLED,
    'CAPTCHA_ENABLED',
  );
  const turnstileSecretKey = asString(config.TURNSTILE_SECRET_KEY).trim();

  if (captchaEnabled && !turnstileSecretKey) {
    throw new Error(
      'TURNSTILE_SECRET_KEY is required when CAPTCHA_ENABLED=true',
    );
  }

  if (nodeEnv === 'production') {
    if (!redisUrl) {
      throw new Error('REDIS_URL is required when NODE_ENV=production');
    }
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when NODE_ENV=production');
    }
    if (betterAuthSecret.length < 32) {
      throw new Error(
        'BETTER_AUTH_SECRET must be at least 32 characters when NODE_ENV=production',
      );
    }
    if (!betterAuthUrl.toLowerCase().startsWith('https://')) {
      throw new Error(
        'BETTER_AUTH_URL must use HTTPS when NODE_ENV=production',
      );
    }
    if (emailProviderRaw === 'test') {
      throw new Error(
        'EMAIL_PROVIDER must not be "test" when NODE_ENV=production',
      );
    }
  }

  if (emailProviderRaw === 'google') {
    if (!emailAddress || !emailPassword) {
      throw new Error(
        'EMAIL_ADDRESS and EMAIL_PASSWORD are required when EMAIL_PROVIDER=google',
      );
    }
  }

  if (emailProviderRaw === 'smtp') {
    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error(
        'SMTP_HOST, SMTP_USER, and SMTP_PASS are required when EMAIL_PROVIDER=smtp',
      );
    }
  }

  if (databaseUrl && nodeEnv !== 'test') {
    if (!platformName) {
      throw new Error('PLATFORM_NAME is required when DATABASE_URL is set');
    }
    if (betterAuthSecret.length < 32) {
      throw new Error(
        'BETTER_AUTH_SECRET must be at least 32 characters when DATABASE_URL is set',
      );
    }
    if (emailProviderRaw === 'test') {
      throw new Error(
        'EMAIL_PROVIDER must not be "test" when DATABASE_URL is set; configure smtp or google with the required credentials',
      );
    }
  }

  return {
    PORT: port,
    NODE_ENV: nodeEnv,
    TRUST_PROXY: trustProxy,
    PRODUCTION_URL: productionUrl,
    DEVELOPMENT_URL: developmentUrl,
    PLATFORM_URL: platformUrl,
    PLATFORM_NAME: platformName,
    ENABLE_API_DOCS: enableApiDocs,
    LOG_LEVEL: logLevel,
    CORS_ORIGINS: corsOriginsRaw,
    REDIS_URL: redisUrl,
    DATABASE_URL: databaseUrl,
    EMAIL_PROVIDER: emailProviderRaw,
    PLATFORM_SUPPORT: platformSupport,
    PLATFORM_LOGO_URL: asString(config.PLATFORM_LOGO_URL).trim(),
    COLOR_CODE: asString(config.COLOR_CODE, '#635BFF').trim(),
    EMAIL_ADDRESS: emailAddress,
    EMAIL_PASSWORD: emailPassword,
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_USER: smtpUser,
    SMTP_PASS: smtpPass,
    RATE_LIMIT_TTL: rateLimitTtl,
    RATE_LIMIT_MAX: rateLimitMax,
    BETTER_AUTH_SECRET:
      betterAuthSecret ||
      (nodeEnv === 'test'
        ? 'test-secret-minimum-32-characters-long'
        : betterAuthSecret),
    BETTER_AUTH_URL: betterAuthUrl,
    BETTER_AUTH_API_KEY: asString(config.BETTER_AUTH_API_KEY).trim(),
    BETTER_AUTH_API_URL: betterAuthApiUrl,
    BETTER_AUTH_IDENTIFY_URL: betterAuthIdentifyUrl,
    BETTER_AUTH_RATE_LIMIT_WINDOW: betterAuthRateLimitWindow,
    BETTER_AUTH_RATE_LIMIT_MAX: betterAuthRateLimitMax,
    BETTER_AUTH_DASH_STARTUP_CHECKS: betterAuthDashStartupChecks,
    CAPTCHA_ENABLED: captchaEnabled,
    TURNSTILE_SECRET_KEY: turnstileSecretKey,
    BACKOFFICE_ADMIN_EMAIL: asString(config.BACKOFFICE_ADMIN_EMAIL).trim(),
    BACKOFFICE_ADMIN_PASSWORD: asString(
      config.BACKOFFICE_ADMIN_PASSWORD,
    ).trim(),
    BACKOFFICE_ADMIN_NAME: asString(
      config.BACKOFFICE_ADMIN_NAME,
      'Backoffice Admin',
    ).trim(),
    GOOGLE_CLIENT_ID: asString(config.GOOGLE_CLIENT_ID).trim(),
    GOOGLE_CLIENT_SECRET: asString(config.GOOGLE_CLIENT_SECRET).trim(),
    GITHUB_CLIENT_ID: asString(config.GITHUB_CLIENT_ID).trim(),
    GITHUB_CLIENT_SECRET: asString(config.GITHUB_CLIENT_SECRET).trim(),
    APPLE_CLIENT_ID: asString(config.APPLE_CLIENT_ID).trim(),
    APPLE_CLIENT_SECRET: asString(config.APPLE_CLIENT_SECRET).trim(),
    MICROSOFT_CLIENT_ID: asString(config.MICROSOFT_CLIENT_ID).trim(),
    MICROSOFT_CLIENT_SECRET: asString(config.MICROSOFT_CLIENT_SECRET).trim(),
    DISCORD_CLIENT_ID: asString(config.DISCORD_CLIENT_ID).trim(),
    DISCORD_CLIENT_SECRET: asString(config.DISCORD_CLIENT_SECRET).trim(),
    TWITTER_CLIENT_ID: asString(config.TWITTER_CLIENT_ID).trim(),
    TWITTER_CLIENT_SECRET: asString(config.TWITTER_CLIENT_SECRET).trim(),
  };
}

export function validateEnvOrExit(
  config: Record<string, unknown> = process.env,
): EnvConfig {
  try {
    return validateEnv(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Configuration error: ${message}`);
    process.exit(1);
  }
}
