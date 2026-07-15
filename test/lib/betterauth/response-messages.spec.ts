import { resolveSuccessMessage } from 'src/lib/betterauth/response/response-messages';

describe('response-messages', () => {
  it('returns exact route messages', () => {
    expect(resolveSuccessMessage('/sign-in/email')).toBe(
      'Signed in successfully',
    );
    expect(resolveSuccessMessage('/get-session')).toBe('Profile retrieved');
    expect(resolveSuccessMessage('/organization/list')).toBe(
      'Organizations retrieved successfully',
    );
    expect(resolveSuccessMessage('/email-otp/send-verification-otp')).toBe(
      'Verification OTP sent',
    );
  });

  it('normalizes paths without leading slash', () => {
    expect(resolveSuccessMessage('ok')).toBe('Auth service is healthy');
  });

  it('returns prefix fallback messages for nested routes', () => {
    expect(resolveSuccessMessage('/organization/custom-action')).toBe(
      'Organization operation completed successfully',
    );
    expect(resolveSuccessMessage('/admin/custom-action')).toBe(
      'Admin operation completed successfully',
    );
    expect(resolveSuccessMessage('/two-factor/custom-action')).toBe(
      'Two-factor operation completed successfully',
    );
    expect(resolveSuccessMessage('/passkey/custom-action')).toBe(
      'Passkey operation completed successfully',
    );
    expect(resolveSuccessMessage('/email-otp/custom-action')).toBe(
      'OTP operation completed successfully',
    );
  });

  it('returns default message for unknown routes', () => {
    expect(resolveSuccessMessage('/unknown-route')).toBe(
      'Request completed successfully',
    );
  });
});
