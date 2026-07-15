import {
  generateReferralCode,
  normalizeReferralCodeInput,
} from 'src/lib/betterauth/hooks/referral-code';

describe('referral-code', () => {
  it('generates unique-looking referral codes', () => {
    const a = generateReferralCode();
    const b = generateReferralCode();
    expect(a).toMatch(/^ref_[a-f0-9]{16}$/);
    expect(b).toMatch(/^ref_[a-f0-9]{16}$/);
    expect(a).not.toBe(b);
  });

  it('normalizes referral code input', () => {
    expect(normalizeReferralCodeInput('  ref_abc  ')).toBe('ref_abc');
    expect(normalizeReferralCodeInput('')).toBeNull();
    expect(normalizeReferralCodeInput('   ')).toBeNull();
    expect(normalizeReferralCodeInput(null)).toBeNull();
    expect(normalizeReferralCodeInput(12)).toBeNull();
  });
});
