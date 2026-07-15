import { randomBytes } from 'node:crypto';

const REFERRAL_CODE_PREFIX = 'ref_';
const REFERRAL_CODE_BYTES = 8;

export function generateReferralCode(): string {
  return `${REFERRAL_CODE_PREFIX}${randomBytes(REFERRAL_CODE_BYTES).toString('hex')}`;
}

export function normalizeReferralCodeInput(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
