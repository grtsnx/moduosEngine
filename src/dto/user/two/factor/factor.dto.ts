import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

import { HandleResponseDto } from '../../../common/handle/response.dto';
import { SAMPLE_TWO_FACTOR_SECRET } from '../../../auth/samples';

export class EnableTwoFactorRequestDto {
  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password!: string;
}

export class VerifyTwoFactorRequestDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class DisableTwoFactorRequestDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export const SAMPLE_ENABLE_2FA_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Two-factor authentication enabled',
  data: {
    totpURI: `otpauth://totp/penielvault:alex@example.com?secret=${SAMPLE_TWO_FACTOR_SECRET}`,
    backupCodes: ['abc123', 'def456'],
  },
} as const;

export const SAMPLE_VERIFY_2FA_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Two-factor code verified',
  data: { success: true },
} as const;

export const SAMPLE_DISABLE_2FA_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Two-factor authentication disabled',
  data: { success: true },
} as const;

export const SAMPLE_VERIFY_2FA_OTP_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Two-factor code verified',
  data: { success: true },
} as const;

export const SAMPLE_VERIFY_2FA_BACKUP_CODE_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Two-factor code verified',
  data: { success: true },
} as const;

export const SAMPLE_SEND_2FA_OTP_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { success: true },
} as const;

export const SAMPLE_GET_2FA_TOTP_URI_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: {
    totpURI: `otpauth://totp/penielvault:alex@example.com?secret=${SAMPLE_TWO_FACTOR_SECRET}`,
  },
} as const;

export const SAMPLE_GENERATE_2FA_BACKUP_CODES_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { backupCodes: ['abc123', 'def456'] },
} as const;

export class EnableTwoFactorResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_ENABLE_2FA_RESPONSE.data })
  declare data: { totpURI: string; backupCodes: string[] };
}

export class VerifyTwoFactorResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_VERIFY_2FA_RESPONSE.data })
  declare data: { success: boolean };
}

export class DisableTwoFactorResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_DISABLE_2FA_RESPONSE.data })
  declare data: { success: boolean };
}
