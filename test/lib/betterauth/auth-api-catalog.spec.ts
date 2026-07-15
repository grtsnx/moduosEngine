import {
  AUTH_API_CATALOG,
  buildApiRouteRewrites,
  catalogPublicPath,
} from 'src/lib/betterauth/catalog/auth-api-catalog';

describe('auth-api-catalog', () => {
  it('has unique public API paths', () => {
    const paths = AUTH_API_CATALOG.map((entry) => catalogPublicPath(entry));
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('maps legacy hyphen routes to slash public paths', () => {
    expect(
      AUTH_API_CATALOG.find((entry) => entry.internalPath === '/sign-up/email')
        ?.publicSuffix,
    ).toBe('/sign/up/email');
    expect(
      AUTH_API_CATALOG.find((entry) => entry.internalPath === '/get-session')
        ?.publicSuffix,
    ).toBe('/profile');
    expect(
      AUTH_API_CATALOG.find(
        (entry) => entry.internalPath === '/organization/invite-member',
      )?.publicSuffix,
    ).toBe('/invite/member');
    expect(
      AUTH_API_CATALOG.find(
        (entry) => entry.internalPath === '/email-otp/request-password-reset',
      )?.publicSuffix,
    ).toBe('/email/otp/request/password/reset');
    expect(
      AUTH_API_CATALOG.find(
        (entry) => entry.internalPath === '/two-factor/verify-totp',
      )?.publicSuffix,
    ).toBe('/two/factor/verify');
  });

  it('builds full-path rewrites to Better Auth internal routes', () => {
    const rewrites = buildApiRouteRewrites();
    const profileRewrite = rewrites.find((entry) =>
      entry.public.endsWith('/user/profile'),
    );

    expect(profileRewrite).toEqual({
      public: '/v1/api/user/profile',
      internal: '/v1/api/auth/get-session',
    });

    const createTeamRewrite = rewrites.find(
      (entry) => entry.public === '/v1/api/teams/create',
    );
    expect(createTeamRewrite).toEqual({
      public: '/v1/api/teams/create',
      internal: '/v1/api/auth/organization/create-team',
    });
  });

  it('places team routes under the teams route group', () => {
    const createTeam = AUTH_API_CATALOG.find(
      (entry) => entry.internalPath === '/organization/create-team',
    );
    expect(createTeam?.routeGroup).toBe('teams');
    expect(catalogPublicPath(createTeam!)).toBe('/v1/api/teams/create');
  });

  it('documents at least 70 auth routes', () => {
    expect(AUTH_API_CATALOG.length).toBeGreaterThanOrEqual(70);
  });
});
