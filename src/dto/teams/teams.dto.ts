import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

import { HandleResponseDto } from '../common/handle/response.dto';
import { sampleAuthSuccess } from '../auth/response/response.dto';

export const SAMPLE_TEAM = {
  id: 'team_01HXYZ000000000000000000',
  name: 'Engineering',
  organizationId: 'org_01HXYZ000000000000000000',
  createdAt: '2026-07-05T00:00:00.000Z',
} as const;

export class CreateTeamRequestDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'org_01HXYZ000000000000000000' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class UpdateTeamRequestDto {
  @ApiProperty({ example: 'team_01HXYZ000000000000000000' })
  @IsString()
  teamId!: string;

  @ApiProperty({ example: 'Platform' })
  @IsString()
  @MinLength(1)
  name!: string;
}

export class TeamIdRequestDto {
  @ApiProperty({ example: 'team_01HXYZ000000000000000000' })
  @IsString()
  teamId!: string;
}

export class AddTeamMemberRequestDto {
  @ApiProperty({ example: 'team_01HXYZ000000000000000000' })
  @IsString()
  teamId!: string;

  @ApiProperty({ example: 'usr_01HXYZ000000000000000000' })
  @IsString()
  userId!: string;
}

export const SAMPLE_CREATE_TEAM_RESPONSE = sampleAuthSuccess(
  'Team created successfully',
  { team: SAMPLE_TEAM },
);

export const SAMPLE_LIST_TEAMS_RESPONSE = sampleAuthSuccess(
  'Teams retrieved successfully',
  { teams: [SAMPLE_TEAM] },
);

export class CreateTeamResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_CREATE_TEAM_RESPONSE.data })
  declare data: { team: typeof SAMPLE_TEAM };
}

export class ListTeamsResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_LIST_TEAMS_RESPONSE.data })
  declare data: { teams: Array<typeof SAMPLE_TEAM> };
}
