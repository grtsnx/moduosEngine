import { isCatalogAuthRequiredPath } from 'src/lib/betterauth/hooks/session-route-guard';

describe('session-route-guard', () => {
  it('requires auth for session-secured catalog routes', () => {
    expect(isCatalogAuthRequiredPath('/get-session')).toBe(true);
    expect(isCatalogAuthRequiredPath('/v1/api/user/profile')).toBe(true);
    expect(isCatalogAuthRequiredPath('/organization/create')).toBe(true);
    expect(isCatalogAuthRequiredPath('/organization/create-team')).toBe(true);
    expect(isCatalogAuthRequiredPath('/v1/api/teams/create')).toBe(true);
    expect(isCatalogAuthRequiredPath('/admin/list-users')).toBe(true);
  });

  it('allows public catalog routes without auth', () => {
    expect(isCatalogAuthRequiredPath('/ok')).toBe(false);
    expect(isCatalogAuthRequiredPath('/sign-up/email')).toBe(false);
    expect(isCatalogAuthRequiredPath('/sign-in/email')).toBe(false);
    expect(isCatalogAuthRequiredPath('/email-otp/send-verification-otp')).toBe(
      false,
    );
  });
});
