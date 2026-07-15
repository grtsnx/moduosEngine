import { AUTH_API_CATALOG } from '../catalog/auth-api-catalog';
import {
  AUTH_BASE_PATH,
  isProxiedBetterAuthPath,
  toBetterAuthRelativePath,
} from '../paths/auth-paths';

function normalizeAuthPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (isProxiedBetterAuthPath(normalized)) {
    return toBetterAuthRelativePath(normalized);
  }

  if (normalized.startsWith(`${AUTH_BASE_PATH}/`)) {
    return normalized.slice(AUTH_BASE_PATH.length);
  }

  if (normalized === AUTH_BASE_PATH) {
    return '/';
  }

  return normalized;
}

/** True when the catalog marks this Better Auth path as session- or admin-secured. */
export function isCatalogAuthRequiredPath(path: string): boolean {
  const normalized = normalizeAuthPath(path);
  const entry = AUTH_API_CATALOG.find(
    (catalogEntry) => catalogEntry.internalPath === normalized,
  );

  return entry?.security === 'session' || entry?.security === 'admin';
}
