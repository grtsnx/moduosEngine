import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

import { PrismaService } from 'src/lib';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this.prismaService.isEnabled()) {
      throw new HealthCheckError(
        'Database is not configured',
        this.getStatus(key, false, { message: 'DATABASE_URL is unset' }),
      );
    }

    const isAlive = await this.prismaService.ping();
    if (!isAlive) {
      throw new HealthCheckError(
        'Database ping failed',
        this.getStatus(key, false, { message: 'SELECT 1 failed' }),
      );
    }

    return this.getStatus(key, true);
  }
}
