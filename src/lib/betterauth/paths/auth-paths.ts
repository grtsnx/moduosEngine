import {
  AUTH_API_CATALOG,
  buildApiRouteRewrites,
  catalogPublicPath,
  type AuthApiCatalogEntry,
} from '../catalog/auth-api-catalog';

export const API_V1_PREFIX = '/v1/api';
export const AUTH_BASE_PATH = `${API_V1_PREFIX}/auth`;
export const USER_BASE_PATH = `${API_V1_PREFIX}/user`;
export const ORGANISATION_BASE_PATH = `${API_V1_PREFIX}/organisation`;
export const TEAMS_BASE_PATH = `${API_V1_PREFIX}/teams`;
export const ADMIN_BASE_PATH = `${API_V1_PREFIX}/admin`;

export const API_ROUTE_REWRITES = buildApiRouteRewrites();

/** @deprecated Use API_ROUTE_REWRITES */
export const AUTH_ROUTE_REWRITES = API_ROUTE_REWRITES;

function normalizeSuffix(suffix: string): string {
  return suffix.startsWith('/') ? suffix : `/${suffix}`;
}

export function authPath(suffix: string): string {
  return `${AUTH_BASE_PATH}${normalizeSuffix(suffix)}`;
}

export function userPath(suffix: string): string {
  return `${USER_BASE_PATH}${normalizeSuffix(suffix)}`;
}

export function organisationPath(suffix: string): string {
  return `${ORGANISATION_BASE_PATH}${normalizeSuffix(suffix)}`;
}

export function teamsPath(suffix: string): string {
  return `${TEAMS_BASE_PATH}${normalizeSuffix(suffix)}`;
}

export function adminPath(suffix: string): string {
  return `${ADMIN_BASE_PATH}${normalizeSuffix(suffix)}`;
}

export { catalogPublicPath };

export function internalAuthPath(suffix: string): string {
  return `${AUTH_BASE_PATH}${normalizeSuffix(suffix)}`;
}

export function toBetterAuthRelativePath(publicPath: string): string {
  const rewrite = API_ROUTE_REWRITES.find(
    (entry) => entry.public === publicPath,
  );
  if (rewrite) {
    return rewrite.internal.slice(AUTH_BASE_PATH.length);
  }

  if (publicPath.startsWith(`${AUTH_BASE_PATH}/`)) {
    return publicPath.slice(AUTH_BASE_PATH.length);
  }

  return publicPath;
}

export function isPublicAuthSuffix(suffix: string): boolean {
  const normalized = normalizeSuffix(suffix);
  return API_ROUTE_REWRITES.some(
    (entry) =>
      entry.public === authPath(normalized) ||
      entry.public.endsWith(normalized),
  );
}

export function buildAuthPathRewriteMap(): Map<string, string> {
  return new Map(
    API_ROUTE_REWRITES.map((entry) => [entry.public, entry.internal]),
  );
}

export function buildLegacyAuthInternalPathSet(): Set<string> {
  const legacy = new Set(API_ROUTE_REWRITES.map((entry) => entry.internal));

  for (const entry of AUTH_API_CATALOG) {
    if (entry.routeGroup === 'auth') {
      continue;
    }

    legacy.add(authPath(entry.legacyAuthPublicSuffix));
  }

  return legacy;
}

export function isProxiedBetterAuthPath(path: string): boolean {
  return (
    path === AUTH_BASE_PATH ||
    path.startsWith(`${AUTH_BASE_PATH}/`) ||
    path === USER_BASE_PATH ||
    path.startsWith(`${USER_BASE_PATH}/`) ||
    path === ORGANISATION_BASE_PATH ||
    path.startsWith(`${ORGANISATION_BASE_PATH}/`) ||
    path === TEAMS_BASE_PATH ||
    path.startsWith(`${TEAMS_BASE_PATH}/`) ||
    path === ADMIN_BASE_PATH ||
    path.startsWith(`${ADMIN_BASE_PATH}/`)
  );
}

export function catalogEntryPublicPath(entry: AuthApiCatalogEntry): string {
  return catalogPublicPath(entry);
}
