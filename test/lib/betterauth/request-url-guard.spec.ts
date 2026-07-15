import { APIError } from 'better-auth/api';

import { assertTrustedAuthCallbackOrRedirect } from 'src/lib/betterauth/hooks/request-url-guard';

describe('assertTrustedAuthCallbackOrRedirect', () => {
  const trustedOrigins = ['https://app.example.com', 'http://localhost:3000'];

  it('skips validation for paths without guarded callback fields', () => {
    expect(() =>
      assertTrustedAuthCallbackOrRedirect('/sign-in/email', {}, trustedOrigins),
    ).not.toThrow();
  });

  it('allows trusted callbackURL values', () => {
    expect(() =>
      assertTrustedAuthCallbackOrRedirect(
        '/sign-in/social',
        { callbackURL: 'https://app.example.com/dashboard' },
        trustedOrigins,
      ),
    ).not.toThrow();
  });

  it('allows trusted callbackURL values on link-social', () => {
    expect(() =>
      assertTrustedAuthCallbackOrRedirect(
        '/link-social',
        { callbackURL: 'https://app.example.com/settings' },
        trustedOrigins,
      ),
    ).not.toThrow();
  });

  it('rejects malformed callbackURL values', () => {
    expect(() =>
      assertTrustedAuthCallbackOrRedirect(
        '/link-social',
        { callbackURL: 'javascript:alert(1)' },
        trustedOrigins,
      ),
    ).toThrow(APIError);

    try {
      assertTrustedAuthCallbackOrRedirect(
        '/link-social',
        { callbackURL: 'javascript:alert(1)' },
        trustedOrigins,
      );
    } catch (error) {
      expect(error).toMatchObject({
        status: 'BAD_REQUEST',
        message: 'callbackURL must be a valid absolute URL',
      });
    }
  });

  it('rejects callbackURL origins outside the trusted allowlist', () => {
    try {
      assertTrustedAuthCallbackOrRedirect(
        '/sign-in/social',
        { callbackURL: 'https://evil.example.com/dashboard' },
        trustedOrigins,
      );
      throw new Error('Expected callbackURL origin validation to fail');
    } catch (error) {
      expect(error).toMatchObject({
        status: 'FORBIDDEN',
        message: 'callbackURL origin is not trusted',
      });
    }
  });

  it('normalizes versioned auth paths before validation', () => {
    expect(() =>
      assertTrustedAuthCallbackOrRedirect(
        '/v1/api/auth/organization/get-invitation-url',
        { callbackURL: 'https://app.example.com/invite' },
        trustedOrigins,
      ),
    ).not.toThrow();
  });
});
