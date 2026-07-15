import { Module } from '@nestjs/common';

import { BackofficeController } from './backoffice.controller';
import { BackofficeService } from './backoffice.service';

@Module({
  controllers: [BackofficeController],
  providers: [BackofficeService],
  exports: [BackofficeService],
})
export class BackofficeModule {}
