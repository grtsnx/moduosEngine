import { createRedisSecondaryStorage } from 'src/lib/betterauth/core/redis-secondary-storage';

describe('redis-secondary-storage', () => {
  it('delegates get, set, delete, and getAndDelete to redis', async () => {
    const redis = {
      get: jest.fn().mockResolvedValue('value'),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const storage = createRedisSecondaryStorage(redis as never);

    await expect(storage.get('key')).resolves.toBe('value');
    await storage.set('key', 'value', 60);
    await storage.delete('key');
    await expect(storage.getAndDelete?.('key')).resolves.toBe('value');

    expect(redis.set).toHaveBeenCalledWith('key', 'value', 'EX', 60);
    expect(redis.del).toHaveBeenCalledTimes(2);
  });

  it('sets without ttl when ttl is omitted', async () => {
    const redis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn(),
    };

    const storage = createRedisSecondaryStorage(redis as never);
    await storage.set('key', 'value');

    expect(redis.set).toHaveBeenCalledWith('key', 'value');
  });

  it('returns null when redis get misses', async () => {
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
    };

    const storage = createRedisSecondaryStorage(redis as never);
    await expect(storage.get('missing')).resolves.toBeNull();
  });

  it('atomically increments with ttl on first write', async () => {
    const redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      eval: jest.fn().mockResolvedValue(1),
    };

    const storage = createRedisSecondaryStorage(redis as never);
    await expect(storage.increment?.('rate:key', 60)).resolves.toBe(1);

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      'rate:key',
      60,
    );
  });
});
