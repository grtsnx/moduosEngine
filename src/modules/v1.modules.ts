import { Global, Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { BackofficeModule } from './backoffice/backoffice.module';
import { OrganisationModule } from './organisation/organisation.module';
import { ReferralModule } from './referral/referral.module';
import { TeamsModule } from './teams/teams.module';
import { UserModule } from './user/user.module';

@Global()
@Module({
  imports: [
    AuthModule.register(),
    UserModule,
    BackofficeModule,
    OrganisationModule,
    TeamsModule,
    ReferralModule,
  ],
  exports: [
    AuthModule,
    UserModule,
    BackofficeModule,
    OrganisationModule,
    TeamsModule,
    ReferralModule,
  ],
})
export class V1Module {}
