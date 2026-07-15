import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { SAMPLE_USER } from '../samples';

export class SendVerificationEmailRequestDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email!: string;
}

export class VerifyEmailRequestDto {
  @ApiProperty({ example: 'verification-token-example' })
  @IsString()
  token!: string;
}

export const SAMPLE_SEND_VERIFICATION_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Verification email sent',
  data: { success: true },
} as const;

export const SAMPLE_VERIFY_EMAIL_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Email verified successfully',
  data: { user: { ...SAMPLE_USER, emailVerified: true } },
} as const;

export class SendVerificationEmailResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_SEND_VERIFICATION_RESPONSE.data })
  declare data: { success: boolean };
}

export class VerifyEmailResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_VERIFY_EMAIL_RESPONSE.data })
  declare data: { user: typeof SAMPLE_USER };
}
