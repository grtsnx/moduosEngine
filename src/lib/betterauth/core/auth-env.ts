function readEnv(key: string, fallback = ''): string {
  const value = process.env[key];
  if (typeof value !== 'string') {
    return fallback;
  }
  return value.trim();
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

function parseHttpOrigin(value: string): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function unique(values: Array<string | null>): string[] {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
}

export function buildTrustedOrigins(): string[] {
  const isProduction = isProductionEnv();
  const configuredOrigins = [
    readEnv('PRODUCTION_URL'),
    readEnv('DEVELOPMENT_URL'),
    readEnv('PLATFORM_URL'),
    readEnv('BETTER_AUTH_URL'),
    ...parseCorsOrigins(readEnv('CORS_ORIGINS')),
  ];

  if (!isProduction) {
    configuredOrigins.push(`http://localhost:${readEnv('PORT', '3000')}`);
  }

  const normalizedOrigins = unique(configuredOrigins.map(parseHttpOrigin));

  if (!isProduction) {
    return normalizedOrigins;
  }

  return normalizedOrigins.filter((origin) => origin.startsWith('https://'));
}

export function resolveBetterAuthUrl(): string {
  const explicit = readEnv('BETTER_AUTH_URL');
  if (explicit) {
    return explicit;
  }

  const platformUrl = readEnv('PLATFORM_URL');
  if (platformUrl) {
    return platformUrl;
  }

  const port = readEnv('PORT', '3000');
  return `http://localhost:${port}`;
}

export function resolveBetterAuthSecret(): string {
  const secret = readEnv('BETTER_AUTH_SECRET');
  if (secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test-secret-minimum-32-characters-long';
  }

  if (process.env.NODE_ENV === 'development') {
    return 'development-secret-minimum-32-characters-long';
  }

  throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
}

export function resolveAuthAppName(): string {
  const platformName = readEnv('PLATFORM_NAME');
  if (platformName) {
    return platformName;
  }

  return 'Platform';
}

type SocialProviderConfig = {
  clientId: string;
  clientSecret: string;
};

function readSocialProvider(
  idKey: string,
  secretKey: string,
): SocialProviderConfig | undefined {
  const clientId = readEnv(idKey);
  const clientSecret = readEnv(secretKey);

  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }

  return undefined;
}

export function buildSocialProviders(): Record<string, SocialProviderConfig> {
  const providers: Record<string, SocialProviderConfig> = {};
  const entries: Array<[string, string, string]> = [
    ['google', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    ['github', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
    ['apple', 'APPLE_CLIENT_ID', 'APPLE_CLIENT_SECRET'],
    ['microsoft', 'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
    ['discord', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'],
    ['twitter', 'TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'],
  ];

  for (const [name, idKey, secretKey] of entries) {
    const config = readSocialProvider(idKey, secretKey);
    if (config) {
      providers[name] = config;
    }
  }

  return providers;
}

export function isProductionEnv(): boolean {
  return readEnv('NODE_ENV', 'development') === 'production';
}

export function isTrustProxyEnabled(): boolean {
  const raw = readEnv('TRUST_PROXY', 'false').toLowerCase();

  if (!raw || raw === 'false' || raw === '0' || raw === 'no' || raw === 'off') {
    return false;
  }

  return true;
}

export const BETTER_AUTH_IP_ADDRESS_HEADERS = [
  'cf-connecting-ip',
  'x-forwarded-for',
  'x-real-ip',
] as const;

export function buildIpAddressHeaders(): string[] {
  return [...BETTER_AUTH_IP_ADDRESS_HEADERS];
}

function parsePositiveInteger(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseBooleanEnv(value: string): boolean | null {
  if (value.length === 0) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return null;
}

export interface BetterAuthRateLimitConfig {
  window: number;
  max: number;
}

export function isBetterAuthRateLimitEnabled(): boolean {
  const explicit = readEnv('BETTER_AUTH_RATE_LIMIT_ENABLED');
  const parsed = parseBooleanEnv(explicit);
  if (parsed !== null) {
    return parsed;
  }

  return readEnv('NODE_ENV', 'development') !== 'test';
}

export function shouldRequireEmailVerification(): boolean {
  const explicit = readEnv('BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION');
  const parsed = parseBooleanEnv(explicit);
  if (parsed !== null) {
    return parsed;
  }

  return readEnv('NODE_ENV', 'development') !== 'test';
}

/**
 * Have I Been Pwned password breach checks. Off in test by default to keep
 * e2e sign-up stable; enabled in production. Override with
 * BETTER_AUTH_HIBP_ENABLED=true|false.
 */
export function shouldEnableHibp(): boolean {
  const explicit = readEnv('BETTER_AUTH_HIBP_ENABLED');
  const parsed = parseBooleanEnv(explicit);
  if (parsed !== null) {
    return parsed;
  }

  return readEnv('NODE_ENV', 'development') === 'production';
}

export function shouldRunDashStartupChecks(): boolean {
  const explicit = readEnv('BETTER_AUTH_DASH_STARTUP_CHECKS');
  const parsed = parseBooleanEnv(explicit);
  if (parsed !== null) {
    return parsed;
  }

  return readEnv('BETTER_AUTH_API_KEY').length > 0;
}

export function readBetterAuthApiUrl(): string {
  return readEnv('BETTER_AUTH_API_URL');
}

/**
 * Better Auth Infra's API-backed email validation (disposable/spam detection)
 * is a gated feature; on unprovisioned projects the `/email/validate` endpoint
 * returns 404 and the plugin fails open with a warning on every sign-up.
 * Off by default; opt in with BETTER_AUTH_EMAIL_VALIDATION=true once enabled
 * on the Better Auth dashboard/plan.
 */
export function shouldEnableInfraEmailValidation(): boolean {
  return parseBooleanEnv(readEnv('BETTER_AUTH_EMAIL_VALIDATION')) === true;
}

/**
 * Cloudflare Turnstile captcha. Off by default; enable with CAPTCHA_ENABLED=true
 * and set TURNSTILE_SECRET_KEY. Clients must send `x-captcha-response` on protected
 * auth POST endpoints.
 */
export function shouldEnableCaptcha(): boolean {
  return parseBooleanEnv(readEnv('CAPTCHA_ENABLED')) === true;
}

export function readTurnstileSecretKey(): string {
  return readEnv('TURNSTILE_SECRET_KEY');
}

/** Better Auth paths that require a Turnstile token when captcha is enabled. */
export const CAPTCHA_PROTECTED_ENDPOINTS = [
  '/sign-up/email',
  '/sign-in/email',
  '/request-password-reset',
  '/email-otp/send-verification-otp',
  '/sign-in/email-otp',
  '/email-otp/request-password-reset',
  '/forget-password/email-otp',
] as const;

export function readBetterAuthIdentifyUrl(): string {
  return readEnv('BETTER_AUTH_IDENTIFY_URL');
}

export function buildBetterAuthRateLimit(): BetterAuthRateLimitConfig {
  return {
    window: parsePositiveInteger(readEnv('BETTER_AUTH_RATE_LIMIT_WINDOW'), 60),
    max: parsePositiveInteger(readEnv('BETTER_AUTH_RATE_LIMIT_MAX'), 100),
  };
}

export function shouldUseSecureCookies(): boolean {
  if (isProductionEnv()) {
    return true;
  }

  try {
    const url = new URL(resolveBetterAuthUrl());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildAdvancedAuthOptions(): {
  useSecureCookies: boolean;
  ipAddress: { ipAddressHeaders: string[] };
} {
  return {
    useSecureCookies: shouldUseSecureCookies(),
    ipAddress: { ipAddressHeaders: buildIpAddressHeaders() },
  };
}

export function hasRedisUrl(): boolean {
  return readEnv('REDIS_URL').length > 0;
}

export function readRedisUrl(): string {
  return readEnv('REDIS_URL');
}

export function readBackofficeSeedConfig(): {
  email: string;
  password: string;
  name: string;
} | null {
  const email = readEnv('BACKOFFICE_ADMIN_EMAIL');
  const password = readEnv('BACKOFFICE_ADMIN_PASSWORD');
  const name = readEnv('BACKOFFICE_ADMIN_NAME', 'Backoffice Admin');

  if (!email || !password) {
    return null;
  }

  return { email, password, name };
}
