import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

import { API_V1_PREFIX } from 'src/lib/betterauth/paths/auth-paths';
import { configureApp, isApiDocsEnabled } from 'src/middleware';

import { productionEnvConfig, testEnvConfig } from '../../fixtures';

describe('configureApp', () => {
  let app: INestApplication;
  let useLogger: jest.Mock;
  let enableShutdownHooks: jest.Mock;
  let setGlobalPrefix: jest.Mock;
  let useGlobalPipes: jest.Mock;
  let enableCors: jest.Mock;
  let disableExpressHeader: jest.Mock;
  let setExpressSetting: jest.Mock;
  let useExpressMiddleware: jest.Mock;
  let loggerWarn: jest.Mock;
  let configValues: Record<string, string | number | boolean>;

  beforeEach(() => {
    useLogger = jest.fn();
    enableShutdownHooks = jest.fn();
    setGlobalPrefix = jest.fn();
    useGlobalPipes = jest.fn();
    enableCors = jest.fn();
    disableExpressHeader = jest.fn();
    setExpressSetting = jest.fn();
    useExpressMiddleware = jest.fn();
    loggerWarn = jest.fn();
    configValues = {
      PORT: 3000,
      NODE_ENV: 'development',
      TRUST_PROXY: false,
      PRODUCTION_URL: 'http://localhost:3000',
      DEVELOPMENT_URL: 'http://localhost:3000',
      PLATFORM_URL: 'http://localhost:3000',
      PLATFORM_NAME: 'TestPlatform',
      ENABLE_API_DOCS: 'true',
      LOG_LEVEL: 'info',
      CORS_ORIGINS: '',
      BETTER_AUTH_URL: 'http://localhost:3000',
      BETTER_AUTH_API_KEY: '',
      BETTER_AUTH_API_URL: '',
      BETTER_AUTH_IDENTIFY_URL: '',
      BETTER_AUTH_DASH_STARTUP_CHECKS: '',
      CAPTCHA_ENABLED: false,
      TURNSTILE_SECRET_KEY: '',
      SMTP_PORT: 587,
    };

    app = {
      useLogger,
      enableShutdownHooks,
      setGlobalPrefix,
      getHttpAdapter: jest.fn().mockReturnValue({
        getInstance: jest.fn().mockReturnValue({
          disable: disableExpressHeader,
          set: setExpressSetting,
          use: useExpressMiddleware,
        }),
      }),
      use: jest.fn(),
      enableCors,
      useGlobalPipes,
      get: jest.fn((token: unknown) => {
        if (token === ConfigService) {
          return {
            get: jest.fn((key: string) => configValues[key]),
          };
        }

        if (token === Logger) {
          return {
            warn: loggerWarn,
          };
        }

        return undefined;
      }),
    } as unknown as INestApplication;
  });

  it('registers security middleware and returns env config', () => {
    const config = configureApp(app);

    expect(useLogger).toHaveBeenCalled();
    expect(enableShutdownHooks).toHaveBeenCalled();
    expect(disableExpressHeader).toHaveBeenCalledWith('x-powered-by');
    expect(setExpressSetting).toHaveBeenCalledWith('trust proxy', false);
    expect(setGlobalPrefix).toHaveBeenCalledWith(API_V1_PREFIX.slice(1), {
      exclude: [
        { path: '', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
      ],
    });
    expect(useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
    expect(config.PORT).toBe(3000);
    expect(config.PLATFORM_NAME).toBe('TestPlatform');
    expect(enableCors).toHaveBeenCalled();
  });

  it('limits production CORS defaults to production/platform origins', () => {
    configValues.NODE_ENV = 'production';
    configValues.CORS_ORIGINS = 'https://admin.example.com';
    configValues.PRODUCTION_URL = 'https://api.example.com';
    configValues.DEVELOPMENT_URL = 'https://dev.example.com';
    configValues.PLATFORM_URL = 'https://app.example.com';

    configureApp(app);

    const corsCalls = enableCors.mock.calls as Array<
      [
        {
          origin: string[];
        },
      ]
    >;
    const corsArg = corsCalls[0]?.[0] as {
      origin: string[];
    };
    expect(corsArg.origin).toEqual([
      'https://api.example.com',
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('applies configured trust proxy value', () => {
    configValues.TRUST_PROXY = 2;

    configureApp(app);

    expect(setExpressSetting).toHaveBeenCalledWith('trust proxy', 2);
  });

  it('warns when ngrok origin settings are inconsistent', () => {
    configValues.BETTER_AUTH_URL = 'https://abc.ngrok-free.app';
    configValues.PRODUCTION_URL = 'https://api.example.com';
    configValues.PLATFORM_URL = 'https://web.example.com';
    configValues.TRUST_PROXY = false;

    configureApp(app);

    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('Ngrok origin mismatch detected'),
    );
    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('TRUST_PROXY=false'),
    );
  });

  it('parses captcha env flags from config service values', () => {
    configValues.CAPTCHA_ENABLED = 'true';
    configValues.TURNSTILE_SECRET_KEY = 'turnstile-secret';

    const config = configureApp(app);

    expect(config.CAPTCHA_ENABLED).toBe(true);
    expect(config.TURNSTILE_SECRET_KEY).toBe('turnstile-secret');
  });

  it('treats string false captcha flag as disabled', () => {
    configValues.CAPTCHA_ENABLED = 'false';
    configValues.TURNSTILE_SECRET_KEY = 'turnstile-secret';

    const config = configureApp(app);

    expect(config.CAPTCHA_ENABLED).toBe(false);
    expect(config.TURNSTILE_SECRET_KEY).toBe('turnstile-secret');
  });
});

describe('isApiDocsEnabled', () => {
  it('returns true in development by default', () => {
    expect(isApiDocsEnabled(testEnvConfig)).toBe(true);
  });

  it('returns false in production unless explicitly enabled', () => {
    expect(isApiDocsEnabled(productionEnvConfig)).toBe(false);
  });
});
