import { Module } from '@nestjs/common';

import { SendMailsModule } from './email/sendMail.module';
import { GravatarModule } from './gravatar/gravatar.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [RedisModule, PrismaModule, SendMailsModule, GravatarModule],
  exports: [RedisModule, PrismaModule, SendMailsModule, GravatarModule],
})
export class LibModule {}
