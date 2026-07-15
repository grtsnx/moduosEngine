import { ApiProperty } from '@nestjs/swagger';

import { HandleResponseDto } from '../common/handle/response.dto';

export const SAMPLE_REFERRAL_ME = {
  referralCode: 'ref_a1b2c3d4e5f60718',
  referredCount: 2,
} as const;

export const SAMPLE_REFERRAL_USER = {
  id: 'usr_01HXYZ000000000000000001',
  email: 'friend@example.com',
  firstName: 'Friend',
  lastName: 'Example',
  createdAt: '2026-07-05T00:00:00.000Z',
} as const;

export class ReferralMeResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_REFERRAL_ME })
  declare data: typeof SAMPLE_REFERRAL_ME;
}

export class ReferralListResponseDto extends HandleResponseDto {
  @ApiProperty({
    example: { referrals: [SAMPLE_REFERRAL_USER] },
  })
  declare data: { referrals: Array<typeof SAMPLE_REFERRAL_USER> };
}

export class ReferralValidateResponseDto extends HandleResponseDto {
  @ApiProperty({ example: { valid: true } })
  declare data: { valid: boolean };
}
