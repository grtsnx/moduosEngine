import { forwardRef, Module } from '@nestjs/common';

import { SendMailsModule } from 'src/lib/email/sendMail.module';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [forwardRef(() => SendMailsModule)],
  providers: [EmailProcessor],
})
export class EmailWorkerModule {}
