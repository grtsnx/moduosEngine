import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AllowAnonymous, Session } from '@thallesp/nestjs-better-auth';

import { handleResponse } from 'src/middleware';

import { ReferralService } from './referral.service';

@ApiTags('Referral')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get current user referral code and count' })
  async getMine(@Session() session: { user: { id: string } }): Promise<never> {
    const data = await this.referralService.getMine(session.user.id);
    throw new handleResponse(200, 'Referral profile retrieved', data);
  }

  @Get('list')
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List users referred by the current user' })
  async listReferred(
    @Session() session: { user: { id: string } },
  ): Promise<never> {
    const data = await this.referralService.listReferred(session.user.id);
    throw new handleResponse(200, 'Referrals retrieved', data);
  }

  @AllowAnonymous()
  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a referral code' })
  async validateCode(@Param('code') code: string): Promise<never> {
    const data = await this.referralService.validateCode(code);
    throw new handleResponse(200, 'Referral code checked', data);
  }
}
