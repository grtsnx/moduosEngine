import {
  ADMIN_BASE_PATH,
  API_ROUTE_REWRITES,
  API_V1_PREFIX,
  AUTH_BASE_PATH,
  ORGANISATION_BASE_PATH,
  TEAMS_BASE_PATH,
  USER_BASE_PATH,
  adminPath,
  authPath,
  catalogPublicPath,
  isProxiedBetterAuthPath,
  isPublicAuthSuffix,
  organisationPath,
  teamsPath,
  toBetterAuthRelativePath,
  userPath,
} from 'src/lib';
import { AUTH_API_CATALOG } from 'src/lib/betterauth/catalog/auth-api-catalog';

describe('auth-paths', () => {
  it('defines the v1 API prefix and domain bases', () => {
    expect(API_V1_PREFIX).toBe('/v1/api');
    expect(AUTH_BASE_PATH).toBe('/v1/api/auth');
    expect(USER_BASE_PATH).toBe('/v1/api/user');
    expect(ORGANISATION_BASE_PATH).toBe('/v1/api/organisation');
    expect(TEAMS_BASE_PATH).toBe('/v1/api/teams');
    expect(ADMIN_BASE_PATH).toBe('/v1/api/admin');
  });

  it('builds public slash paths from suffixes', () => {
    expect(authPath('/ok')).toBe('/v1/api/auth/ok');
    expect(authPath('/sign/in/email')).toBe('/v1/api/auth/sign/in/email');
    expect(userPath('/profile')).toBe('/v1/api/user/profile');
    expect(organisationPath('/create')).toBe('/v1/api/organisation/create');
    expect(teamsPath('/create')).toBe('/v1/api/teams/create');
    expect(adminPath('/list/users')).toBe('/v1/api/admin/list/users');
  });

  it('maps public paths to Better Auth internal relative paths', () => {
    expect(toBetterAuthRelativePath(authPath('/sign/up/email'))).toBe(
      '/sign-up/email',
    );
    expect(toBetterAuthRelativePath(userPath('/profile'))).toBe('/get-session');
    expect(toBetterAuthRelativePath(organisationPath('/create'))).toBe(
      '/organization/create',
    );
    expect(toBetterAuthRelativePath(teamsPath('/create'))).toBe(
      '/organization/create-team',
    );
    expect(toBetterAuthRelativePath(adminPath('/list/users'))).toBe(
      '/admin/list-users',
    );
    expect(toBetterAuthRelativePath(authPath('/two/factor/verify'))).toBe(
      '/two-factor/verify-totp',
    );
  });

  it('identifies registered public API suffixes', () => {
    for (const entry of API_ROUTE_REWRITES) {
      const suffix = entry.public.replace(/^\/v1\/api\/[^/]+/, '');
      expect(isPublicAuthSuffix(suffix)).toBe(true);
    }

    expect(isPublicAuthSuffix('/sign-in/email')).toBe(false);
  });

  it('detects proxied Better Auth public paths', () => {
    expect(isProxiedBetterAuthPath('/v1/api/auth/sign/in/email')).toBe(true);
    expect(isProxiedBetterAuthPath('/v1/api/user/profile')).toBe(true);
    expect(isProxiedBetterAuthPath('/v1/api/organisation/list')).toBe(true);
    expect(isProxiedBetterAuthPath('/v1/api/teams/create')).toBe(true);
    expect(isProxiedBetterAuthPath('/v1/api/admin/list/users')).toBe(true);
    expect(isProxiedBetterAuthPath('/health')).toBe(false);
  });

  it('builds catalog public paths per route group', () => {
    const profileEntry = AUTH_API_CATALOG.find(
      (entry) => entry.internalPath === '/get-session',
    );
    expect(profileEntry).toBeDefined();
    expect(catalogPublicPath(profileEntry!)).toBe('/v1/api/user/profile');
  });
});
