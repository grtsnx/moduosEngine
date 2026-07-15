import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

import { RedisService } from 'src/lib/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this.redisService.isEnabled()) {
      throw new HealthCheckError(
        'Redis is not configured',
        this.getStatus(key, false, { message: 'REDIS_URL is unset' }),
      );
    }

    const isAlive = await this.redisService.ping();
    if (!isAlive) {
      throw new HealthCheckError(
        'Redis ping failed',
        this.getStatus(key, false, { message: 'PING failed' }),
      );
    }

    return this.getStatus(key, true);
  }
}
