import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/lib';
import { normalizeReferralCodeInput } from 'src/lib/betterauth/hooks/referral-code';

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string): Promise<{
    referralCode: string;
    referredCount: number;
  }> {
    const client = this.prisma.client();
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        _count: { select: { referrals: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      referralCode: user.referralCode,
      referredCount: user._count.referrals,
    };
  }

  async listReferred(userId: string): Promise<{
    referrals: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      createdAt: Date;
    }>;
  }> {
    const client = this.prisma.client();
    const referrals = await client.user.findMany({
      where: { referredByUserId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { referrals };
  }

  async validateCode(code: string): Promise<{ valid: boolean }> {
    const normalized = normalizeReferralCodeInput(code);
    if (!normalized) {
      return { valid: false };
    }

    const client = this.prisma.client();
    const match = await client.user.findUnique({
      where: { referralCode: normalized },
      select: { id: true },
    });

    return { valid: Boolean(match) };
  }
}
