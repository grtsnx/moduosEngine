import { HealthCheckError } from '@nestjs/terminus';

import { PrismaService } from 'src/lib';
import { PrismaHealthIndicator } from 'src/middleware/health/prisma.health';
import { QueueHealthIndicator } from 'src/middleware/health/queue.health';
import { RedisHealthIndicator } from 'src/middleware/health/redis.health';
import { QueueService } from 'src/middleware/queue/queue.service';
import { RedisService } from 'src/lib/redis/redis.service';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let redisService: { isEnabled: jest.Mock; ping: jest.Mock };

  beforeEach(() => {
    redisService = {
      isEnabled: jest.fn(),
      ping: jest.fn(),
    };
    indicator = new RedisHealthIndicator(
      redisService as unknown as RedisService,
    );
  });

  it('returns healthy when redis responds to ping', async () => {
    redisService.isEnabled.mockReturnValue(true);
    redisService.ping.mockResolvedValue(true);

    await expect(indicator.isHealthy('redis')).resolves.toEqual({
      redis: { status: 'up' },
    });
  });

  it('throws when redis is not configured', async () => {
    redisService.isEnabled.mockReturnValue(false);

    await expect(indicator.isHealthy('redis')).rejects.toBeInstanceOf(
      HealthCheckError,
    );
  });

  it('throws when ping fails', async () => {
    redisService.isEnabled.mockReturnValue(true);
    redisService.ping.mockResolvedValue(false);

    await expect(indicator.isHealthy('redis')).rejects.toBeInstanceOf(
      HealthCheckError,
    );
  });
});

describe('QueueHealthIndicator', () => {
  let indicator: QueueHealthIndicator;
  let queueService: { isEnabled: jest.Mock };

  beforeEach(() => {
    queueService = { isEnabled: jest.fn() };
    indicator = new QueueHealthIndicator(
      queueService as unknown as QueueService,
    );
  });

  it('returns healthy when queue is enabled', () => {
    queueService.isEnabled.mockReturnValue(true);

    expect(indicator.isHealthy('queue')).toEqual({
      queue: { status: 'up' },
    });
  });

  it('throws when queue is not configured', () => {
    queueService.isEnabled.mockReturnValue(false);

    expect(() => indicator.isHealthy('queue')).toThrow(HealthCheckError);
  });
});

describe('PrismaHealthIndicator', () => {
  let indicator: PrismaHealthIndicator;
  let prismaService: { isEnabled: jest.Mock; ping: jest.Mock };

  beforeEach(() => {
    prismaService = {
      isEnabled: jest.fn(),
      ping: jest.fn(),
    };
    indicator = new PrismaHealthIndicator(
      prismaService as unknown as PrismaService,
    );
  });

  it('returns healthy when database responds to ping', async () => {
    prismaService.isEnabled.mockReturnValue(true);
    prismaService.ping.mockResolvedValue(true);

    await expect(indicator.isHealthy('database')).resolves.toEqual({
      database: { status: 'up' },
    });
  });

  it('throws when database is not configured', async () => {
    prismaService.isEnabled.mockReturnValue(false);

    await expect(indicator.isHealthy('database')).rejects.toBeInstanceOf(
      HealthCheckError,
    );
  });

  it('throws when ping fails', async () => {
    prismaService.isEnabled.mockReturnValue(true);
    prismaService.ping.mockResolvedValue(false);

    await expect(indicator.isHealthy('database')).rejects.toBeInstanceOf(
      HealthCheckError,
    );
  });
});
