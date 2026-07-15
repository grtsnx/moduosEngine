import { DynamicModule, Module } from '@nestjs/common';

import { BetterAuthModule, SendMailsModule } from 'src/lib';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({})
export class AuthModule {
  static register(): DynamicModule {
    const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';

    const imports = databaseUrl
      ? [BetterAuthModule.register(), SendMailsModule]
      : [SendMailsModule];

    return {
      module: AuthModule,
      imports,
      controllers: [AuthController],
      providers: [AuthService],
      exports: [AuthService],
    };
  }
}
