import { ConfigService } from '@nestjs/config';

import { redisConnectionConfig, redisUrlFixtures } from '../../fixtures';
import { getRedisConnectionOptions } from 'src/middleware';

function createConfigService(value: string): ConfigService {
  return {
    get: jest.fn(() => value),
  } as unknown as ConfigService;
}

describe('getRedisConnectionOptions', () => {
  it('returns null when REDIS_URL is empty', () => {
    expect(
      getRedisConnectionOptions(createConfigService(redisUrlFixtures.unset)),
    ).toBeNull();
  });

  it('returns null when REDIS_URL is whitespace', () => {
    expect(
      getRedisConnectionOptions(
        createConfigService(redisUrlFixtures.whitespace),
      ),
    ).toBeNull();
  });

  it('returns lazyConnect config when REDIS_URL is set', () => {
    expect(
      getRedisConnectionOptions(createConfigService(redisUrlFixtures.valid)),
    ).toEqual(redisConnectionConfig);
  });
});
