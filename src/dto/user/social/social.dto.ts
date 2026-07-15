import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { HandleResponseDto } from '../../common/handle/response.dto';

export class SignInSocialRequestDto {
  @ApiProperty({ example: 'google' })
  @IsString()
  provider!: string;

  @ApiProperty({ example: 'https://app.example.com/dashboard' })
  @IsString()
  callbackURL!: string;
}

export const SAMPLE_SIGN_IN_SOCIAL_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Social sign-in initiated',
  data: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=example',
    redirect: true,
  },
} as const;

export class SignInSocialResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_SIGN_IN_SOCIAL_RESPONSE.data })
  declare data: { url: string; redirect: boolean };
}
