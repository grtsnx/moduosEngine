import { ApiProperty } from '@nestjs/swagger';

import { SAMPLE_SESSION, SAMPLE_USER } from '../samples';

export class SendVerificationOtpDto {
  @ApiProperty({ example: 'alex@example.com' })
  email!: string;

  @ApiProperty({
    example: 'email-verification',
    enum: ['email-verification', 'sign-in', 'forget-password'],
  })
  type!: 'email-verification' | 'sign-in' | 'forget-password';
}

export class CheckVerificationOtpDto {
  @ApiProperty({ example: 'alex@example.com' })
  email!: string;

  @ApiProperty({
    example: 'email-verification',
    enum: ['email-verification', 'sign-in', 'forget-password'],
  })
  type!: 'email-verification' | 'sign-in' | 'forget-password';

  @ApiProperty({ example: '123456' })
  otp!: string;
}

export class VerifyEmailOtpDto {
  @ApiProperty({ example: 'alex@example.com' })
  email!: string;

  @ApiProperty({ example: '123456' })
  otp!: string;
}

export class SignInEmailOtpDto {
  @ApiProperty({ example: 'alex@example.com' })
  email!: string;

  @ApiProperty({ example: '123456' })
  otp!: string;
}

export class RequestPasswordResetOtpDto {
  @ApiProperty({ example: 'alex@example.com' })
  email!: string;
}

export class ResetPasswordOtpDto {
  @ApiProperty({ example: 'alex@example.com' })
  email!: string;

  @ApiProperty({ example: '123456' })
  otp!: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  password!: string;
}

export const SAMPLE_SEND_VERIFICATION_OTP_RESPONSE = {
  statusCode: 200,
  statusType: 'OK' as const,
  message: 'Verification OTP sent',
  data: { success: true },
};

export const SAMPLE_VERIFY_EMAIL_OTP_RESPONSE = {
  statusCode: 200,
  statusType: 'OK' as const,
  message: 'Email verified successfully',
  data: {
    success: true,
    token: 'session-token-example',
    user: SAMPLE_USER,
  },
};

export const SAMPLE_SIGN_IN_EMAIL_OTP_RESPONSE = {
  statusCode: 200,
  statusType: 'OK' as const,
  message: 'Signed in successfully',
  data: { user: SAMPLE_USER, session: SAMPLE_SESSION },
};

export const SAMPLE_REQUEST_PASSWORD_RESET_OTP_RESPONSE = {
  statusCode: 200,
  statusType: 'OK' as const,
  message: 'Password reset OTP sent',
  data: { success: true },
};

export const SAMPLE_RESET_PASSWORD_OTP_RESPONSE = {
  statusCode: 200,
  statusType: 'OK' as const,
  message: 'Password reset successfully',
  data: { success: true },
};
