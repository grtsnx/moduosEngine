import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

import { STRONG_PASSWORD_MIN_LENGTH, STRONG_PASSWORD_PATTERN } from 'src/lib';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { SAMPLE_USER } from '../samples';

export class ChangePasswordRequestDto {
  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(STRONG_PASSWORD_MIN_LENGTH)
  @Matches(STRONG_PASSWORD_PATTERN, {
    message:
      'newPassword must include uppercase, lowercase, number, and special character',
  })
  newPassword!: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  revokeOtherSessions?: boolean;
}

export const SAMPLE_CHANGE_PASSWORD_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { user: SAMPLE_USER },
} as const;

export class ChangePasswordResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_CHANGE_PASSWORD_RESPONSE.data })
  declare data: { user: typeof SAMPLE_USER };
}

export class RequestPasswordResetRequestDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'https://app.example.com/reset-password' })
  @IsString()
  redirectTo!: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'reset-token-example' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(STRONG_PASSWORD_MIN_LENGTH)
  @Matches(STRONG_PASSWORD_PATTERN, {
    message:
      'newPassword must include uppercase, lowercase, number, and special character',
  })
  newPassword!: string;
}

export const SAMPLE_REQUEST_PASSWORD_RESET_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Password reset OTP sent',
  data: { success: true },
} as const;

export const SAMPLE_RESET_PASSWORD_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Password reset successfully',
  data: { success: true },
} as const;

export class RequestPasswordResetResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_REQUEST_PASSWORD_RESET_RESPONSE.data })
  declare data: { success: boolean };
}

export class ResetPasswordResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_RESET_PASSWORD_RESPONSE.data })
  declare data: { success: boolean };
}
