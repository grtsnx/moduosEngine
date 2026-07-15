import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

import { HandleResponseDto } from '../../common/handle/response.dto';
import {
  SAMPLE_PASSKEY_CREDENTIAL,
  SAMPLE_SESSION,
  SAMPLE_USER,
} from '../../auth/samples';

export class RegisterPasskeyRequestDto {
  @ApiProperty({ example: 'MacBook Pro Touch ID' })
  @IsString()
  name!: string;
}

export class SignInPasskeyRequestDto {
  @ApiProperty({ example: { id: 'passkey-credential-id' } })
  @IsObject()
  credential!: Record<string, unknown>;
}

export const SAMPLE_REGISTER_PASSKEY_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Passkey registered successfully',
  data: { passkey: SAMPLE_PASSKEY_CREDENTIAL },
} as const;

export const SAMPLE_SIGN_IN_PASSKEY_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Signed in with passkey successfully',
  data: { user: SAMPLE_USER, session: SAMPLE_SESSION },
} as const;

export const SAMPLE_VERIFY_PASSKEY_REGISTRATION_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Passkey registered successfully',
  data: { passkey: SAMPLE_PASSKEY_CREDENTIAL },
} as const;

export const SAMPLE_LIST_PASSKEYS_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { passkeys: [SAMPLE_PASSKEY_CREDENTIAL] },
} as const;

export const SAMPLE_UPDATE_PASSKEY_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { passkey: SAMPLE_PASSKEY_CREDENTIAL },
} as const;

export const SAMPLE_DELETE_PASSKEY_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { success: true },
} as const;

export class RegisterPasskeyResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_REGISTER_PASSKEY_RESPONSE.data })
  declare data: { passkey: typeof SAMPLE_PASSKEY_CREDENTIAL };
}

export class SignInPasskeyResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_SIGN_IN_PASSKEY_RESPONSE.data })
  declare data: { user: typeof SAMPLE_USER; session: typeof SAMPLE_SESSION };
}
