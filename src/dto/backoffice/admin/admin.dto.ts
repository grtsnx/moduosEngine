import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { SAMPLE_SESSION, SAMPLE_USER } from '../../auth/samples';
import { sampleAuthSuccess } from '../../auth/response/response.dto';

export class BanUserRequestDto {
  @ApiProperty({ example: 'usr_01HXYZ000000000000000000' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 'Terms of service violation' })
  @IsString()
  banReason!: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  banExpiresIn?: boolean;
}

export const SAMPLE_LIST_USERS_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Users retrieved successfully',
  data: { users: [SAMPLE_USER], total: 1 },
} as const;

export const SAMPLE_BAN_USER_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'User banned successfully',
  data: { user: { ...SAMPLE_USER, banned: true } },
} as const;

export const SAMPLE_ADMIN_OPERATION_RESPONSE = sampleAuthSuccess(
  'Admin operation completed successfully',
  { user: SAMPLE_USER },
);

export const SAMPLE_ADMIN_SESSION_LIST_RESPONSE = sampleAuthSuccess(
  'Admin operation completed successfully',
  { sessions: [SAMPLE_SESSION] },
);

export class ListUsersResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_LIST_USERS_RESPONSE.data })
  declare data: { users: (typeof SAMPLE_USER)[]; total: number };
}

export class BanUserResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_BAN_USER_RESPONSE.data })
  declare data: { user: typeof SAMPLE_USER & { banned: boolean } };
}
