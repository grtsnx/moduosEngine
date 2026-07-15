import { normalizeAuthRelativePath } from '../paths/normalize-auth-path';

const REDIRECT_PATH_PREFIXES = ['/callback/', '/oauth2/callback/'] as const;

/** Infra dashboard and audit routes must return native Better Auth JSON. */
const INFRA_PATH_PREFIXES = ['/dash/', '/events/'] as const;

export function shouldSkipEnvelope(path: string): boolean {
  const normalized = normalizeAuthRelativePath(path);

  if (
    INFRA_PATH_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(prefix),
    )
  ) {
    return true;
  }

  return REDIRECT_PATH_PREFIXES.some(
    (prefix) =>
      normalized === prefix ||
      normalized.startsWith(prefix) ||
      normalized.includes('/callback/'),
  );
}
