import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { sampleAuthSuccess } from '../../auth/response/response.dto';

export class LinkSocialRequestDto {
  @ApiProperty({ example: 'google' })
  @IsString()
  provider!: string;

  @ApiProperty({ example: 'https://app.example.com/dashboard' })
  @IsString()
  callbackURL!: string;
}

export class UnlinkAccountRequestDto {
  @ApiProperty({ example: 'google' })
  @IsString()
  providerId!: string;
}

export class GetAccessTokenRequestDto {
  @ApiProperty({ example: 'google' })
  @IsString()
  providerId!: string;
}

export const SAMPLE_LIST_ACCOUNTS_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: {
    accounts: [
      {
        id: 'acc_01HXYZ000000000000000000',
        providerId: 'credential',
        accountId: 'usr_01HXYZ000000000000000000',
      },
    ],
  },
} as const;

export const SAMPLE_LINK_SOCIAL_RESPONSE = sampleAuthSuccess(
  'Request completed successfully',
  { url: 'https://accounts.google.com/o/oauth2/auth' },
);

export const SAMPLE_UNLINK_ACCOUNT_RESPONSE = sampleAuthSuccess(
  'Request completed successfully',
);

export const SAMPLE_GET_ACCESS_TOKEN_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { accessToken: 'provider-access-token-example' },
} as const;

export class ListAccountsResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_LIST_ACCOUNTS_RESPONSE.data })
  declare data: { accounts: Array<Record<string, string>> };
}
