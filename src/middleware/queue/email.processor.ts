import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';

import { SendMailsService } from 'src/lib';
import { getRedisConnectionOptions } from '../common/redis-connection';
import { isValidSendEmailJobPayload } from './email-job.validation';
import { EMAIL_JOB_SEND, EMAIL_QUEUE_NAME } from './queue.constants';

@Injectable()
export class EmailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailProcessor.name);
  private worker: Worker | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => SendMailsService))
    private readonly sendMailsService: SendMailsService,
  ) {}

  onModuleInit(): void {
    const connection = getRedisConnectionOptions(this.configService);
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (!connection || nodeEnv === 'test') {
      return;
    }

    this.worker = new Worker(
      EMAIL_QUEUE_NAME,
      async (job) => {
        if (job.name !== EMAIL_JOB_SEND) {
          this.logger.warn(`Ignoring unknown job: ${job.name}`);
          return;
        }

        if (!isValidSendEmailJobPayload(job.data)) {
          this.logger.warn(
            `Rejecting malformed email job: ${job.id ?? 'unknown'}`,
          );
          return;
        }

        const payload = job.data;
        await this.sendMailsService.sendEmail(
          payload.to,
          payload.subject,
          payload.template,
          payload.context,
        );
      },
      {
        connection: {
          url: connection.url,
          maxRetriesPerRequest: connection.maxRetriesPerRequest,
        },
        concurrency: 5,
        removeOnComplete: {
          age: 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 86400,
          count: 5000,
        },
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Email job ${job?.id ?? 'unknown'} failed: ${error.message}`,
        error.stack,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
