import {
  runAuthBeforeRequest,
  wrapAuthBeforeError,
} from 'src/lib/betterauth/hooks/auth-before-hook';

describe('auth-before-hook', () => {
  it('wraps sign-up validation APIError in handleResponse shape', () => {
    try {
      runAuthBeforeRequest('/sign-up/email', { email: 'alex@example.com' }, [
        'http://localhost:3000',
      ]);
      fail('expected validation to throw');
    } catch (error) {
      const body = wrapAuthBeforeError(error);
      expect(body).toEqual({
        statusCode: 400,
        statusType: 'BAD_REQUEST',
        message: 'firstName is required',
      });
    }
  });

  it('returns null for non-APIError failures', () => {
    expect(wrapAuthBeforeError(new Error('boom'))).toBeNull();
    expect(wrapAuthBeforeError(null)).toBeNull();
  });

  it('passes through valid sign-up payloads', () => {
    expect(() =>
      runAuthBeforeRequest(
        '/sign-up/email',
        {
          email: 'alex@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          firstName: 'Alex',
          lastName: 'Example',
        },
        ['http://localhost:3000'],
      ),
    ).not.toThrow();
  });
});
