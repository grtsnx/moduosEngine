import { APIError } from 'better-auth/api';

import {
  assertSignUpBody,
  assertStrongPassword,
  composeDisplayName,
  handleAuthPasswordValidation,
  normalizeSignUpBody,
  STRONG_PASSWORD_MAX_LENGTH,
} from 'src/lib/betterauth/hooks/sign-up-validation';

describe('sign-up-validation', () => {
  const validPayload = {
    firstName: 'Alex',
    lastName: 'Example',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
  };

  it('accepts a strong password', () => {
    expect(() => assertStrongPassword('SecurePass123!')).not.toThrow();
  });

  it('rejects short passwords', () => {
    expect(() => assertStrongPassword('short')).toThrow(APIError);
  });

  it('rejects passwords without complexity', () => {
    expect(() => assertStrongPassword('abcdefghijkl')).toThrow(APIError);
  });

  it('rejects passwords over max length', () => {
    const tooLong = `${'SecurePass123!'.repeat(20)}x`;
    expect(tooLong.length).toBeGreaterThan(STRONG_PASSWORD_MAX_LENGTH);
    expect(() => assertStrongPassword(tooLong)).toThrow(APIError);
  });

  it('composes display name from first and last name', () => {
    expect(composeDisplayName('Alex', 'Example')).toBe('Alex Example');
  });

  it('requires firstName and lastName on sign-up', () => {
    expect(() => assertSignUpBody({ ...validPayload, firstName: '' })).toThrow(
      APIError,
    );
    expect(() =>
      assertSignUpBody({ ...validPayload, lastName: '   ' }),
    ).toThrow(APIError);
  });

  it('requires confirmPassword and matching password', () => {
    expect(() =>
      assertSignUpBody({ ...validPayload, confirmPassword: undefined }),
    ).toThrow(APIError);
    expect(() =>
      assertSignUpBody({ ...validPayload, confirmPassword: 'Mismatch123!' }),
    ).toThrow(APIError);
  });

  it('derives name and strips confirmPassword during normalization', () => {
    const body = { ...validPayload };
    normalizeSignUpBody(body);

    expect(body).toMatchObject({
      firstName: 'Alex',
      lastName: 'Example',
      name: 'Alex Example',
    });
    expect(body).not.toHaveProperty('confirmPassword');
  });

  it('validates sign-up and reset-password paths via hook helper', () => {
    const signUpBody: Record<string, unknown> = { ...validPayload };
    handleAuthPasswordValidation('/sign-up/email', signUpBody);
    expect(signUpBody.name).toBe('Alex Example');

    expect(() =>
      handleAuthPasswordValidation('/reset-password', { newPassword: 'short' }),
    ).toThrow(APIError);
  });
});
