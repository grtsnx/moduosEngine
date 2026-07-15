import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { SAMPLE_SESSION } from '../../auth/samples';
import { sampleAuthSuccess } from '../../auth/response/response.dto';

export class RevokeSessionRequestDto {
  @ApiProperty({ example: 'session-token-example' })
  @IsString()
  token!: string;
}

export class UpdateSessionRequestDto {
  @ApiProperty({ example: { theme: 'dark' }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export const SAMPLE_LIST_SESSIONS_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { sessions: [SAMPLE_SESSION] },
} as const;

export const SAMPLE_REVOKE_SESSION_RESPONSE = sampleAuthSuccess(
  'Request completed successfully',
);

export const SAMPLE_REVOKE_SESSIONS_RESPONSE = sampleAuthSuccess(
  'Request completed successfully',
);

export const SAMPLE_REVOKE_OTHER_SESSIONS_RESPONSE = sampleAuthSuccess(
  'Request completed successfully',
);

export const SAMPLE_UPDATE_SESSION_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { session: SAMPLE_SESSION },
} as const;

export class ListSessionsResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_LIST_SESSIONS_RESPONSE.data })
  declare data: { sessions: (typeof SAMPLE_SESSION)[] };
}
