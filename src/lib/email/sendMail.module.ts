import { join } from 'node:path';

import { Global, Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';

import { createMailerModuleOptions } from 'src/middleware/config/mail-transport.factory';
import { QueueModule } from 'src/middleware/queue/queue.module';
import { SendMailsService } from './sendMail.service';

@Global()
@Module({
  imports: [
    forwardRef(() => QueueModule),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const partialsDir = join(__dirname, 'templates/partials');

        return {
          ...createMailerModuleOptions(configService),
          options: {
            partials: {
              dir: partialsDir,
              options: { strict: true },
            },
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter({
              eq: (a: unknown, b: unknown) => a === b,
            }),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [SendMailsService],
  exports: [SendMailsService],
})
export class SendMailsModule {}
