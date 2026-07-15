import type Redis from 'ioredis';

const INCREMENT_WITH_TTL_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

export interface SecondaryStorage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  getAndDelete?: (key: string) => Promise<string | null>;
  increment?: (key: string, ttl: number) => Promise<number>;
}

export function createRedisSecondaryStorage(redis: Redis): SecondaryStorage {
  return {
    get: async (key) => {
      const value = await redis.get(key);
      return value ?? null;
    },
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value, 'EX', ttl);
        return;
      }
      await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
    getAndDelete: async (key) => {
      const value = await redis.get(key);
      if (value !== null) {
        await redis.del(key);
      }
      return value;
    },
    increment: async (key, ttl) => {
      const result = await redis.eval(INCREMENT_WITH_TTL_SCRIPT, 1, key, ttl);
      return Number(result);
    },
  };
}
