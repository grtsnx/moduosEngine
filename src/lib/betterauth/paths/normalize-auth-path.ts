import { AUTH_BASE_PATH } from './auth-paths';

export function normalizeAuthRelativePath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (normalized.startsWith(`${AUTH_BASE_PATH}/`)) {
    return normalized.slice(AUTH_BASE_PATH.length);
  }

  if (normalized === AUTH_BASE_PATH) {
    return '/';
  }

  return normalized;
}
