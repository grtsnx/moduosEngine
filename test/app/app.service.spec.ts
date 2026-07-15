import { HealthCheckError, HealthCheckService } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { AppService } from 'src/app';
import {
  handleResponse,
  PrismaHealthIndicator,
  QueueHealthIndicator,
  RedisHealthIndicator,
} from 'src/middleware';

describe('AppService', () => {
  let appService: AppService;
  let healthCheckService: { check: jest.Mock };
  let redisHealth: { isHealthy: jest.Mock };
  let queueHealth: { isHealthy: jest.Mock };
  let prismaHealth: { isHealthy: jest.Mock };

  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        info: {
          redis: { status: 'up' },
          queue: { status: 'up' },
          database: { status: 'up' },
        },
      }),
    };
    redisHealth = { isHealthy: jest.fn() };
    queueHealth = { isHealthy: jest.fn() };
    prismaHealth = { isHealthy: jest.fn() };

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: RedisHealthIndicator, useValue: redisHealth },
        { provide: QueueHealthIndicator, useValue: queueHealth },
        { provide: PrismaHealthIndicator, useValue: prismaHealth },
      ],
    }).compile();

    appService = app.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return Hello World', () => {
      expect(appService.getHello()).toBe('Hello World!');
    });
  });

  describe('getHealth', () => {
    it('should throw handleResponse with up status', () => {
      expect(() => appService.getHealth()).toThrow(handleResponse);

      try {
        appService.getHealth();
      } catch (error) {
        expect(error).toBeInstanceOf(handleResponse);
        expect((error as handleResponse).getResponse()).toEqual({
          statusCode: 200,
          statusType: 'OK',
          message: 'OK',
          data: { status: 'up' },
        });
      }
    });
  });

  describe('getReadiness', () => {
    it('should throw handleResponse with 200 when all checks pass', async () => {
      const checkResult = {
        status: 'ok' as const,
        info: {
          redis: { status: 'up' as const },
          queue: { status: 'up' as const },
          database: { status: 'up' as const },
        },
        error: {},
        details: {
          redis: { status: 'up' as const },
          queue: { status: 'up' as const },
          database: { status: 'up' as const },
        },
      };
      healthCheckService.check.mockResolvedValue(checkResult);

      await expect(appService.getReadiness()).rejects.toBeInstanceOf(
        handleResponse,
      );

      try {
        await appService.getReadiness();
      } catch (error) {
        expect((error as handleResponse).getResponse()).toEqual({
          statusCode: 200,
          statusType: 'OK',
          message: 'OK',
          data: {
            status: 'ok',
            checks: checkResult.details,
          },
        });
      }
    });

    it('should throw handleResponse with 503 when a check fails', async () => {
      const causes = {
        redis: { status: 'down' as const, message: 'PING failed' },
      };
      healthCheckService.check.mockRejectedValue(
        new HealthCheckError('Redis ping failed', causes),
      );

      await expect(appService.getReadiness()).rejects.toBeInstanceOf(
        handleResponse,
      );

      try {
        await appService.getReadiness();
      } catch (error) {
        expect((error as handleResponse).getStatus()).toBe(503);
        expect((error as handleResponse).getResponse()).toEqual({
          statusCode: 503,
          statusType: 'SERVICE_UNAVAILABLE',
          message: 'Service Unavailable',
          data: {
            status: 'error',
            checks: causes,
          },
        });
      }
    });
  });
});
