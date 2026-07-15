import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { LibModule } from 'src/lib/lib.module';
import { QueueModule } from '../queue/queue.module';
import { PrismaHealthIndicator } from './prisma.health';
import { QueueHealthIndicator } from './queue.health';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [TerminusModule, LibModule, QueueModule],
  providers: [
    RedisHealthIndicator,
    QueueHealthIndicator,
    PrismaHealthIndicator,
  ],
  exports: [
    TerminusModule,
    RedisHealthIndicator,
    QueueHealthIndicator,
    PrismaHealthIndicator,
  ],
})
export class HealthModule {}
