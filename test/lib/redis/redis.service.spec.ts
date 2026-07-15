import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { redisKeyFixtures, redisUrlFixtures } from '../../fixtures';
import { RedisService } from 'src/lib';

let capturedRedisErrorHandler: ((error: Error) => void) | undefined;

const mockRedisClient = {
  setex: jest.fn().mockResolvedValue('OK'),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest
    .fn()
    .mockResolvedValue(JSON.stringify(redisKeyFixtures.sampleValue)),
  del: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(2),
  keys: jest.fn().mockResolvedValue(['user:1']),
  quit: jest.fn().mockResolvedValue('OK'),
  ping: jest.fn().mockResolvedValue('PONG'),
  on: jest.fn((event: string, handler: (error: Error) => void) => {
    if (event === 'error') {
      capturedRedisErrorHandler = handler;
    }
  }),
};

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedisClient),
}));

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();
    capturedRedisErrorHandler = undefined;
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify(redisKeyFixtures.sampleValue),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'REDIS_URL' ? redisUrlFixtures.valid : '',
            ),
          },
        },
      ],
    }).compile();

    service = module.get(RedisService);
  });

  it('reports enabled when REDIS_URL is configured', () => {
    expect(service.isEnabled()).toBe(true);
  });

  it('registers an error handler on the redis client', () => {
    expect(mockRedisClient.on).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
  });

  it('logs a warning when the redis client emits an error', () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    expect(capturedRedisErrorHandler).toBeDefined();
    capturedRedisErrorHandler?.(new Error('read ECONNRESET'));

    expect(warnSpy).toHaveBeenCalledWith(
      'Redis connection error: read ECONNRESET',
    );

    warnSpy.mockRestore();
  });

  it('ping returns true when redis responds with PONG', async () => {
    await expect(service.ping()).resolves.toBe(true);
    expect(mockRedisClient.ping).toHaveBeenCalled();
  });

  it('ping returns false when redis is disabled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => redisUrlFixtures.unset) },
        },
      ],
    }).compile();

    await expect(module.get(RedisService).ping()).resolves.toBe(false);
  });

  it('ping returns false when ping throws', async () => {
    mockRedisClient.ping.mockRejectedValueOnce(new Error('connection refused'));
    await expect(service.ping()).resolves.toBe(false);
  });

  it('set stores JSON with optional expiry', async () => {
    await service.set(
      redisKeyFixtures.sampleKey,
      redisKeyFixtures.sampleValue,
      60,
    );

    expect(mockRedisClient.setex).toHaveBeenCalledWith(
      redisKeyFixtures.sampleKey,
      60,
      JSON.stringify(redisKeyFixtures.sampleValue),
    );
  });

  it('get parses stored JSON', async () => {
    await expect(
      service.get<{ id: number }>(redisKeyFixtures.sampleKey),
    ).resolves.toEqual(redisKeyFixtures.sampleValue);
  });

  it('delete removes a key', async () => {
    await service.delete(redisKeyFixtures.sampleKey);
    expect(mockRedisClient.del).toHaveBeenCalledWith(
      redisKeyFixtures.sampleKey,
    );
  });

  it('increment returns the new value', async () => {
    await expect(service.increment('counter')).resolves.toBe(2);
  });

  it('tryAcquireLock returns true when SET NX succeeds', async () => {
    mockRedisClient.set.mockResolvedValueOnce('OK');
    await expect(
      service.tryAcquireLock(redisKeyFixtures.lockKey, 30),
    ).resolves.toBe(true);
  });

  it('getByPattern returns matched keys', async () => {
    await expect(
      service.getByPattern<{ id: number }>(redisKeyFixtures.userPattern),
    ).resolves.toEqual({
      'user:1': redisKeyFixtures.sampleValue,
    });
  });

  it('set stores JSON without expiry when TTL omitted', async () => {
    await service.set(
      redisKeyFixtures.sampleKey,
      redisKeyFixtures.sampleValueNoTtl,
    );

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      redisKeyFixtures.sampleKey,
      JSON.stringify(redisKeyFixtures.sampleValueNoTtl),
    );
    expect(mockRedisClient.setex).not.toHaveBeenCalled();
  });

  it('get returns null when key is missing', async () => {
    mockRedisClient.get.mockResolvedValueOnce(null);
    await expect(service.get(redisKeyFixtures.missingKey)).resolves.toBeNull();
  });

  it('tryAcquireLock returns false when SET NX fails', async () => {
    mockRedisClient.set.mockResolvedValueOnce(null);
    await expect(
      service.tryAcquireLock(redisKeyFixtures.lockKey, 30),
    ).resolves.toBe(false);
  });

  it('getByPattern returns empty object when no keys match', async () => {
    mockRedisClient.keys.mockResolvedValueOnce([]);
    await expect(
      service.getByPattern(redisKeyFixtures.emptyPattern),
    ).resolves.toEqual({});
  });

  it('onModuleDestroy is safe when redis is disabled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => redisUrlFixtures.unset) },
        },
      ],
    }).compile();

    await expect(
      module.get(RedisService).onModuleDestroy(),
    ).resolves.toBeUndefined();
  });

  describe('onModuleInit', () => {
    let logSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);
      warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('logs connected when redis responds to ping', async () => {
      await service.onModuleInit();
      expect(logSpy).toHaveBeenCalledWith('✓ Redis connected');
    });

    it('warns when REDIS_URL is unset', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn(() => redisUrlFixtures.unset) },
          },
        ],
      }).compile();

      await module.get(RedisService).onModuleInit();

      expect(warnSpy).toHaveBeenCalledWith(
        'REDIS_URL not set; Redis is disabled',
      );
    });

    it('errors when ping fails', async () => {
      mockRedisClient.ping.mockRejectedValueOnce(
        new Error('connection refused'),
      );

      await service.onModuleInit();

      expect(errorSpy).toHaveBeenCalledWith('Redis connection failed');
    });
  });

  it('is disabled when REDIS_URL is unset', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => redisUrlFixtures.unset),
          },
        },
      ],
    }).compile();

    const disabledService = module.get(RedisService);
    expect(disabledService.isEnabled()).toBe(false);
    await expect(
      disabledService.set(redisKeyFixtures.sampleKey, 'value'),
    ).rejects.toThrow('Redis is not configured');
  });
});
