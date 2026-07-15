import * as express from 'express';
import helmet from 'helmet';

import {
  INestApplication,
  Logger as NestLogger,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { API_V1_PREFIX } from 'src/lib/betterauth/paths/auth-paths';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

import { authResponseEnvelope } from '../common/auth-response-envelope';
import { logAuthErrors } from '../common/log-auth-errors';
import { normalizeForwardedHeaders } from '../common/normalize-forwarded-headers';
import { rewriteAuthPaths } from '../common/rewrite-auth-paths';
import { EnvConfig } from './env.validation';

function parseCorsOrigins(corsOrigins: string): (string | RegExp)[] {
  if (!corsOrigins) {
    return [];
  }

  return corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildCorsOrigins(config: EnvConfig): (string | RegExp)[] {
  const baseOrigins =
    config.NODE_ENV === 'production'
      ? [config.PRODUCTION_URL, config.PLATFORM_URL]
      : [
          config.PRODUCTION_URL,
          config.DEVELOPMENT_URL,
          config.PLATFORM_URL,
          `http://localhost:${config.PORT}`,
        ];

  const origins: (string | RegExp)[] = [
    ...baseOrigins,
    ...parseCorsOrigins(config.CORS_ORIGINS),
  ];

  const filtered = origins.filter((origin): origin is string | RegExp =>
    typeof origin === 'string' ? origin.length > 0 : true,
  );

  return [...new Set(filtered)];
}

function toOrigin(value: string): string {
  if (!value.trim()) {
    return '';
  }

  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function isNgrokOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  return (
    origin.includes('.ngrok-free.app') ||
    origin.includes('.ngrok.app') ||
    origin.includes('.ngrok.io')
  );
}

function warnNgrokProxyConsistency(
  config: EnvConfig,
  logger: Pick<NestLogger, 'warn'>,
): void {
  const betterAuthOrigin = toOrigin(config.BETTER_AUTH_URL);
  const productionOrigin = toOrigin(config.PRODUCTION_URL);
  const platformOrigin = toOrigin(config.PLATFORM_URL);
  const origins = [betterAuthOrigin, productionOrigin, platformOrigin].filter(
    Boolean,
  );

  const activeNgrokOrigin =
    (isNgrokOrigin(betterAuthOrigin) ? betterAuthOrigin : '') ||
    origins.find(isNgrokOrigin);

  if (!activeNgrokOrigin) {
    return;
  }

  const mismatched = [
    ['BETTER_AUTH_URL', betterAuthOrigin],
    ['PRODUCTION_URL', productionOrigin],
    ['PLATFORM_URL', platformOrigin],
  ].filter(([, origin]) => origin !== activeNgrokOrigin);

  if (mismatched.length > 0) {
    const mismatchedVars = mismatched.map(([name]) => name).join(', ');
    logger.warn(
      `Ngrok origin mismatch detected. Active origin: ${activeNgrokOrigin}. Align ${mismatchedVars} with the active ngrok URL to prevent Better Auth dash failures.`,
    );
  }

  if (config.TRUST_PROXY === false) {
    logger.warn(
      'Ngrok proxy detected while TRUST_PROXY=false. Set TRUST_PROXY=true (or a trusted hop count) so Better Auth receives normalized forwarded headers.',
    );
  }
}

export function getEnvConfig(configService: ConfigService): EnvConfig {
  return {
    PORT: configService.get<number>('PORT') ?? 3000,
    NODE_ENV: (configService.get<string>('NODE_ENV') ??
      'development') as EnvConfig['NODE_ENV'],
    TRUST_PROXY:
      configService.get<EnvConfig['TRUST_PROXY']>('TRUST_PROXY') ?? false,
    PRODUCTION_URL: configService.get<string>('PRODUCTION_URL') ?? '',
    DEVELOPMENT_URL: configService.get<string>('DEVELOPMENT_URL') ?? '',
    PLATFORM_URL: configService.get<string>('PLATFORM_URL') ?? '',
    PLATFORM_NAME: configService.get<string>('PLATFORM_NAME') ?? '',
    ENABLE_API_DOCS: configService.get<string>('ENABLE_API_DOCS') ?? 'true',
    LOG_LEVEL: configService.get<string>('LOG_LEVEL') ?? 'info',
    CORS_ORIGINS: configService.get<string>('CORS_ORIGINS') ?? '',
    REDIS_URL: configService.get<string>('REDIS_URL') ?? '',
    DATABASE_URL: configService.get<string>('DATABASE_URL') ?? '',
    EMAIL_PROVIDER:
      (configService.get<string>(
        'EMAIL_PROVIDER',
      ) as EnvConfig['EMAIL_PROVIDER']) ?? 'test',
    PLATFORM_SUPPORT: configService.get<string>('PLATFORM_SUPPORT') ?? '',
    PLATFORM_LOGO_URL: configService.get<string>('PLATFORM_LOGO_URL') ?? '',
    COLOR_CODE: configService.get<string>('COLOR_CODE') ?? '#635BFF',
    EMAIL_ADDRESS: configService.get<string>('EMAIL_ADDRESS') ?? '',
    EMAIL_PASSWORD: configService.get<string>('EMAIL_PASSWORD') ?? '',
    SMTP_HOST: configService.get<string>('SMTP_HOST') ?? '',
    SMTP_PORT: configService.get<number>('SMTP_PORT') ?? 587,
    SMTP_USER: configService.get<string>('SMTP_USER') ?? '',
    SMTP_PASS: configService.get<string>('SMTP_PASS') ?? '',
    RATE_LIMIT_TTL: configService.get<number>('RATE_LIMIT_TTL') ?? 60000,
    RATE_LIMIT_MAX: configService.get<number>('RATE_LIMIT_MAX') ?? 30,
    BETTER_AUTH_SECRET: configService.get<string>('BETTER_AUTH_SECRET') ?? '',
    BETTER_AUTH_URL: configService.get<string>('BETTER_AUTH_URL') ?? '',
    BETTER_AUTH_API_KEY: configService.get<string>('BETTER_AUTH_API_KEY') ?? '',
    BETTER_AUTH_API_URL: configService.get<string>('BETTER_AUTH_API_URL') ?? '',
    BETTER_AUTH_IDENTIFY_URL:
      configService.get<string>('BETTER_AUTH_IDENTIFY_URL') ?? '',
    BETTER_AUTH_RATE_LIMIT_WINDOW:
      configService.get<number>('BETTER_AUTH_RATE_LIMIT_WINDOW') ?? 60,
    BETTER_AUTH_RATE_LIMIT_MAX:
      configService.get<number>('BETTER_AUTH_RATE_LIMIT_MAX') ?? 100,
    BETTER_AUTH_DASH_STARTUP_CHECKS:
      configService.get<string>('BETTER_AUTH_DASH_STARTUP_CHECKS') ?? '',
    CAPTCHA_ENABLED: (() => {
      const raw = configService.get<string | boolean>('CAPTCHA_ENABLED');
      if (typeof raw === 'boolean') {
        return raw;
      }
      if (typeof raw !== 'string') {
        return false;
      }
      const normalized = raw.trim().toLowerCase();
      return ['true', '1', 'yes', 'on'].includes(normalized);
    })(),
    TURNSTILE_SECRET_KEY:
      configService.get<string>('TURNSTILE_SECRET_KEY') ?? '',
    BACKOFFICE_ADMIN_EMAIL:
      configService.get<string>('BACKOFFICE_ADMIN_EMAIL') ?? '',
    BACKOFFICE_ADMIN_PASSWORD:
      configService.get<string>('BACKOFFICE_ADMIN_PASSWORD') ?? '',
    BACKOFFICE_ADMIN_NAME:
      configService.get<string>('BACKOFFICE_ADMIN_NAME') ?? '',
    GOOGLE_CLIENT_ID: configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
    GOOGLE_CLIENT_SECRET:
      configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
    GITHUB_CLIENT_ID: configService.get<string>('GITHUB_CLIENT_ID') ?? '',
    GITHUB_CLIENT_SECRET:
      configService.get<string>('GITHUB_CLIENT_SECRET') ?? '',
    APPLE_CLIENT_ID: configService.get<string>('APPLE_CLIENT_ID') ?? '',
    APPLE_CLIENT_SECRET: configService.get<string>('APPLE_CLIENT_SECRET') ?? '',
    MICROSOFT_CLIENT_ID: configService.get<string>('MICROSOFT_CLIENT_ID') ?? '',
    MICROSOFT_CLIENT_SECRET:
      configService.get<string>('MICROSOFT_CLIENT_SECRET') ?? '',
    DISCORD_CLIENT_ID: configService.get<string>('DISCORD_CLIENT_ID') ?? '',
    DISCORD_CLIENT_SECRET:
      configService.get<string>('DISCORD_CLIENT_SECRET') ?? '',
    TWITTER_CLIENT_ID: configService.get<string>('TWITTER_CLIENT_ID') ?? '',
    TWITTER_CLIENT_SECRET:
      configService.get<string>('TWITTER_CLIENT_SECRET') ?? '',
  };
}

export function configureApp(app: INestApplication): EnvConfig {
  const configService = app.get(ConfigService);
  const config = getEnvConfig(configService);
  const appLogger = app.get(Logger);

  const {
    PORT: port,
    PRODUCTION_URL: productionUrl,
    DEVELOPMENT_URL: developmentUrl,
    PLATFORM_URL: platformUrl,
  } = config;

  app.useLogger(appLogger);
  app.enableShutdownHooks();

  const expressApp = app.getHttpAdapter().getInstance() as express.Application;
  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', config.TRUST_PROXY);
  expressApp.use(normalizeForwardedHeaders);
  expressApp.use(logAuthErrors);
  expressApp.use(rewriteAuthPaths);
  expressApp.use(authResponseEnvelope);
  warnNgrokProxyConsistency(config, appLogger);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
          ],
          'img-src': [
            "'self'",
            'data:',
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
          ],
          'font-src': [
            "'self'",
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
          ],
          'connect-src': [
            "'self'",
            productionUrl,
            developmentUrl,
            platformUrl,
            `http://localhost:${port}`,
          ].filter((origin) => origin.length > 0),
        },
      },
    }),
  );

  app.setGlobalPrefix(API_V1_PREFIX.slice(1), {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  app.enableCors({
    origin: buildCorsOrigins(config),
    credentials: true,
    optionsSuccessStatus: 200,
    methods: 'GET,PATCH,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Visitor-Id',
      'X-Request-Id',
      'X-Device-Id',
      'X-Device-Name',
    ],
  });

  app.use(
    express.json({
      limit: '10kb',
      verify: (req: express.Request & { rawBody?: Buffer }, _res, buffer) => {
        req.rawBody = Buffer.from(buffer);
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  return config;
}

export function isApiDocsEnabled(config: EnvConfig): boolean {
  return config.NODE_ENV !== 'production' || config.ENABLE_API_DOCS === 'true';
}
