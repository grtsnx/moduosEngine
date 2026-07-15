import { createHash } from 'node:crypto';

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { getRedisConnectionOptions } from '../common/redis-connection';
import type { SendEmailJobPayload } from '../types/email.types';
import { isValidSendEmailJobPayload } from './email-job.validation';
import { EMAIL_JOB_SEND, EMAIL_QUEUE_NAME } from './queue.constants';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queue: Queue | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const connection = getRedisConnectionOptions(this.configService);
    if (!connection) {
      this.logger.warn('REDIS_URL not set; queue operations are disabled');
      return;
    }

    this.queue = new Queue(EMAIL_QUEUE_NAME, {
      connection: {
        url: connection.url,
        maxRetriesPerRequest: connection.maxRetriesPerRequest,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          age: 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 86400,
          count: 5000,
        },
      },
    });
    this.logger.log('✓ Queue connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }

  isEnabled(): boolean {
    return this.queue !== null;
  }

  async enqueue(
    jobName: string,
    payload: SendEmailJobPayload,
  ): Promise<boolean> {
    if (!this.queue) {
      this.logger.warn(`Cannot enqueue ${jobName}; Redis is not configured`);
      return false;
    }

    if (!isValidSendEmailJobPayload(payload)) {
      this.logger.warn(`Cannot enqueue ${jobName}; payload validation failed`);
      return false;
    }

    await this.queue.add(jobName, payload, {
      jobId: this.buildEmailJobId(jobName, payload),
    });
    return true;
  }

  async enqueueEmailSend(payload: SendEmailJobPayload): Promise<boolean> {
    return this.enqueue(EMAIL_JOB_SEND, payload);
  }

  private buildEmailJobId(
    jobName: string,
    payload: SendEmailJobPayload,
  ): string {
    const payloadKey = JSON.stringify({
      jobName,
      to: payload.to,
      subject: payload.subject,
      template: payload.template,
      context: payload.context ?? null,
    });

    return createHash('sha256').update(payloadKey).digest('hex');
  }
}
