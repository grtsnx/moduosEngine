import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

export interface RedisConnectionConfig {
  url: string;
  lazyConnect: true;
  maxRetriesPerRequest: null;
}

export function getRedisConnectionOptions(
  configService: ConfigService,
): RedisConnectionConfig | null {
  const url = configService.get<string>('REDIS_URL')?.trim() ?? '';
  if (!url) {
    return null;
  }

  return {
    url,
    lazyConnect: true,
    maxRetriesPerRequest: null,
  };
}

export function toRedisOptions(config: RedisConnectionConfig): RedisOptions {
  return {
    lazyConnect: config.lazyConnect,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    // Keep idle sockets warm so a remote Redis behind NAT/a firewall doesn't
    // silently drop them (surfaces as `read ECONNRESET`). ioredis reconnects
    // regardless; this just stops the idle-drop churn.
    keepAlive: 30_000,
    // Bound reconnect backoff so a blip recovers quickly instead of stalling.
    retryStrategy: (times) => Math.min(times * 200, 2_000),
  };
}
