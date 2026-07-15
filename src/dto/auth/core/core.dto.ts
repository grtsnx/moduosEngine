import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

import { STRONG_PASSWORD_MIN_LENGTH, STRONG_PASSWORD_PATTERN } from 'src/lib';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { Match } from '../../common/match/match.decorator';
import { SAMPLE_SESSION, SAMPLE_USER } from '../samples';

export class SignUpEmailRequestDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(STRONG_PASSWORD_MIN_LENGTH)
  @Matches(STRONG_PASSWORD_PATTERN, {
    message:
      'password must include uppercase, lowercase, number, and special character',
  })
  password!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(STRONG_PASSWORD_MIN_LENGTH)
  @Match('password')
  confirmPassword!: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Example' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiPropertyOptional({ example: 'ref_a1b2c3d4e5f60718' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class SignInEmailRequestDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(STRONG_PASSWORD_MIN_LENGTH)
  password!: string;
}

export const SAMPLE_AUTH_OK_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Auth service is healthy',
  data: { status: 'ok' },
} as const;

export const SAMPLE_SIGN_UP_EMAIL_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Account created. Verify your email to sign in.',
  data: { user: SAMPLE_USER },
} as const;

export const SAMPLE_SIGN_IN_EMAIL_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Signed in successfully',
  data: { user: SAMPLE_USER, session: SAMPLE_SESSION },
} as const;

export const SAMPLE_SIGN_OUT_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Signed out successfully',
  data: { success: true },
} as const;

export const SAMPLE_GET_SESSION_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Profile retrieved',
  data: { user: SAMPLE_USER, session: SAMPLE_SESSION },
} as const;

export class AuthOkResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_AUTH_OK_RESPONSE })
  declare data: { status: string };
}

export class SignUpEmailResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_SIGN_UP_EMAIL_RESPONSE.data })
  declare data: { user: typeof SAMPLE_USER };
}

export class SignInEmailResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_SIGN_IN_EMAIL_RESPONSE.data })
  declare data: { user: typeof SAMPLE_USER; session: typeof SAMPLE_SESSION };
}

export class SignOutResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_SIGN_OUT_RESPONSE.data })
  declare data: { success: boolean };
}

export class GetSessionResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_GET_SESSION_RESPONSE.data })
  declare data: { user: typeof SAMPLE_USER; session: typeof SAMPLE_SESSION };
}
