import { forwardRef, Module } from '@nestjs/common';

import { SendMailsModule } from 'src/lib/email/sendMail.module';
import { QueueService } from './queue.service';

@Module({
  imports: [forwardRef(() => SendMailsModule)],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
