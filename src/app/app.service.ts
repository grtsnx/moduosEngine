import { HttpException, Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthCheckService,
  type HealthCheckResult,
} from '@nestjs/terminus';

import {
  handleResponse,
  normalizeReadinessPayload,
  PrismaHealthIndicator,
  QueueHealthIndicator,
  RedisHealthIndicator,
} from 'src/middleware';

@Injectable()
export class AppService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly queueHealth: QueueHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): never {
    throw new handleResponse(200, 'OK', { status: 'up' });
  }

  async getReadiness(): Promise<never> {
    try {
      const result = await this.health.check([
        () => this.redisHealth.isHealthy('redis'),
        () => Promise.resolve(this.queueHealth.isHealthy('queue')),
        () => this.prismaHealth.isHealthy('database'),
      ]);
      throw new handleResponse(200, 'OK', normalizeReadinessPayload(result));
    } catch (error) {
      if (error instanceof HealthCheckError) {
        const causes = error.causes as HealthCheckResult;
        throw new handleResponse(
          503,
          'Service Unavailable',
          normalizeReadinessPayload(causes),
        );
      }

      if (error instanceof HttpException && error.getStatus() === 503) {
        const response = error.getResponse();
        throw new handleResponse(
          503,
          'Service Unavailable',
          typeof response === 'object' && response !== null
            ? normalizeReadinessPayload(response as HealthCheckResult)
            : response,
        );
      }

      throw error;
    }
  }
}
