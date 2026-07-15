import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { SAMPLE_ORGANIZATION } from '../../auth/samples';
import { sampleAuthSuccess } from '../../auth/response/response.dto';

export class CreateOrganizationRequestDto {
  @ApiProperty({ example: 'Acme Billing' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'acme-billing' })
  @IsString()
  @MinLength(1)
  slug!: string;
}

export class InviteMemberRequestDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'member' })
  @IsString()
  role!: string;
}

export class AcceptInvitationRequestDto {
  @ApiProperty({ example: 'invitation-token-example' })
  @IsString()
  invitationId!: string;
}

export const SAMPLE_CREATE_ORGANIZATION_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Organization created successfully',
  data: { organization: SAMPLE_ORGANIZATION },
} as const;

export const SAMPLE_INVITE_MEMBER_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Invitation sent successfully',
  data: { invitationId: 'inv_01HXYZ000000000000000000' },
} as const;

export const SAMPLE_ACCEPT_INVITATION_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Invitation accepted successfully',
  data: { member: { organizationId: SAMPLE_ORGANIZATION.id, role: 'member' } },
} as const;

export const SAMPLE_LIST_ORGANIZATIONS_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Organizations retrieved successfully',
  data: { organizations: [SAMPLE_ORGANIZATION] },
} as const;

export const SAMPLE_ORGANIZATION_OPERATION_RESPONSE = sampleAuthSuccess(
  'Organization operation completed successfully',
  { organization: SAMPLE_ORGANIZATION },
);

export const SAMPLE_ORGANIZATION_MEMBER_RESPONSE = sampleAuthSuccess(
  'Organization operation completed successfully',
  { member: { organizationId: SAMPLE_ORGANIZATION.id, role: 'member' } },
);

export const SAMPLE_ORGANIZATION_LIST_RESPONSE = sampleAuthSuccess(
  'Organization operation completed successfully',
  { items: [SAMPLE_ORGANIZATION] },
);

export class CreateOrganizationResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_CREATE_ORGANIZATION_RESPONSE.data })
  declare data: { organization: typeof SAMPLE_ORGANIZATION };
}

export class InviteMemberResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_INVITE_MEMBER_RESPONSE.data })
  declare data: { invitationId: string };
}

export class AcceptInvitationResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_ACCEPT_INVITATION_RESPONSE.data })
  declare data: { member: { organizationId: string; role: string } };
}

export class ListOrganizationsResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_LIST_ORGANIZATIONS_RESPONSE.data })
  declare data: { organizations: (typeof SAMPLE_ORGANIZATION)[] };
}
