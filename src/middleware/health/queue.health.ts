import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

import { QueueService } from '../queue/queue.service';

@Injectable()
export class QueueHealthIndicator extends HealthIndicator {
  constructor(private readonly queueService: QueueService) {
    super();
  }

  isHealthy(key: string): HealthIndicatorResult {
    if (!this.queueService.isEnabled()) {
      throw new HealthCheckError(
        'Queue is not configured',
        this.getStatus(key, false, { message: 'REDIS_URL is unset' }),
      );
    }

    return this.getStatus(key, true);
  }
}
