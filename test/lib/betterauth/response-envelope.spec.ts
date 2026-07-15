import { APIError } from 'better-auth/api';

import { shouldSkipEnvelope } from 'src/lib/betterauth/response/redirect-paths';
import {
  isMissingAuthSession,
  mapApiErrorStatus,
  resolveAuthMessage,
  wrapAuthData,
  wrapAuthError,
  wrapAuthSuccess,
  wrapMissingAuthSessionError,
} from 'src/lib/betterauth/response/response-envelope';
import { shouldTreatMessageOnlyReturnAsError } from 'src/lib/betterauth/response/response-messages';

describe('redirect-paths', () => {
  it('skips OAuth callback paths', () => {
    expect(shouldSkipEnvelope('/callback/google')).toBe(true);
    expect(shouldSkipEnvelope('/sign-in/email')).toBe(false);
  });

  it('skips Better Auth Infrastructure dash and events paths', () => {
    expect(shouldSkipEnvelope('/dash/validate')).toBe(true);
    expect(shouldSkipEnvelope('/dash/config')).toBe(true);
    expect(shouldSkipEnvelope('/events/list')).toBe(true);
    expect(shouldSkipEnvelope('/v1/api/auth/dash/list-organizations')).toBe(
      true,
    );
    expect(shouldSkipEnvelope('/v1/api/auth/events/list')).toBe(true);
  });
});

describe('response-envelope', () => {
  it('wraps success payloads in handleResponse shape', () => {
    const body = wrapAuthSuccess('/sign-in/email', {
      user: { id: '1' },
      session: { id: '2' },
    });

    expect(body).toMatchObject({
      statusCode: 200,
      statusType: 'OK',
      message: 'Signed in successfully',
      data: { user: { id: '1' }, session: { id: '2' } },
    });
  });

  it('wraps APIError payloads', () => {
    const error = new APIError('UNAUTHORIZED', { message: 'Unauthorized' });
    const body = wrapAuthError(error);

    expect(body).toMatchObject({
      statusCode: 401,
      statusType: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
  });

  it('treats null get-session responses as missing auth', () => {
    expect(isMissingAuthSession('/get-session', null)).toBe(true);
    expect(isMissingAuthSession('/get-session', undefined)).toBe(true);
    expect(isMissingAuthSession('/get-session', {})).toBe(true);
    expect(
      isMissingAuthSession('/get-session', {
        user: { id: '1' },
      }),
    ).toBe(true);
    expect(
      isMissingAuthSession('/get-session', {
        user: { id: '1' },
        session: { id: '2' },
      }),
    ).toBe(false);
    expect(
      isMissingAuthSession('/get-session', {
        user: null,
        session: null,
      }),
    ).toBe(true);
    expect(isMissingAuthSession('/v1/api/auth/get-session', null)).toBe(true);
    expect(isMissingAuthSession('/v1/api/user/profile', null)).toBe(true);
    expect(isMissingAuthSession('/sign-out', null)).toBe(false);
    expect(wrapMissingAuthSessionError()).toMatchObject({
      statusCode: 401,
      statusType: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
  });

  it('maps /ok message', () => {
    expect(resolveAuthMessage('/ok').message).toBe('Auth service is healthy');
  });

  it('unwraps nested body payloads when present', () => {
    expect(wrapAuthData('/token', { body: { token: 'abc' } })).toEqual({
      token: 'abc',
    });
  });

  it('normalizes /ok payload to legacy data shape', () => {
    expect(wrapAuthData('/ok', { ok: true })).toEqual({ status: 'ok' });
  });

  it('normalizes boolean status fields to success for legacy clients', () => {
    expect(
      wrapAuthData('/email-otp/send-verification-otp', { status: true }),
    ).toEqual({
      success: true,
    });
  });

  it('maps API error status codes', () => {
    const error = new APIError('BAD_REQUEST', { message: 'Invalid request' });
    expect(mapApiErrorStatus(error)).toBe(400);
  });

  it('does not treat message-only OTP send responses as errors', () => {
    expect(
      shouldTreatMessageOnlyReturnAsError('/email-otp/send-verification-otp'),
    ).toBe(false);
    expect(
      shouldTreatMessageOnlyReturnAsError('/email-otp/request-password-reset'),
    ).toBe(false);
    expect(shouldTreatMessageOnlyReturnAsError('/sign-in/email')).toBe(true);
  });
});
