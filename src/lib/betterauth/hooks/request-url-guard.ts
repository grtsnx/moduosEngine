import { APIError } from 'better-auth/api';

import { normalizeAuthRelativePath } from '../paths/normalize-auth-path';

type GuardedField = 'callbackURL' | 'redirectTo';

interface AuthUrlRule {
  field: GuardedField;
  path: string;
}

const AUTH_URL_RULES: readonly AuthUrlRule[] = [
  { path: '/sign-in/social', field: 'callbackURL' },
  { path: '/link-social', field: 'callbackURL' },
  { path: '/organization/get-invitation-url', field: 'callbackURL' },
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseHttpOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    if (parsed.username || parsed.password) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

function getRule(path: string): AuthUrlRule | undefined {
  const normalized = normalizeAuthRelativePath(path);
  return AUTH_URL_RULES.find((rule) => normalized === rule.path);
}

export function assertTrustedAuthCallbackOrRedirect(
  path: string,
  body: unknown,
  trustedOrigins: readonly string[],
): void {
  const rule = getRule(path);
  if (!rule) {
    return;
  }

  const payload = asRecord(body);
  if (!payload) {
    return;
  }

  const raw = payload[rule.field];
  if (raw === undefined || raw === null) {
    return;
  }

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new APIError('BAD_REQUEST', {
      message: `${rule.field} must be a valid absolute URL`,
    });
  }

  const normalizedValue = raw.trim();
  const origin = parseHttpOrigin(normalizedValue);
  if (!origin) {
    throw new APIError('BAD_REQUEST', {
      message: `${rule.field} must be a valid absolute URL`,
    });
  }

  const trustedOriginSet = new Set(
    trustedOrigins
      .map((trustedOrigin) => parseHttpOrigin(trustedOrigin))
      .filter((trustedOrigin): trustedOrigin is string =>
        Boolean(trustedOrigin),
      ),
  );

  if (!trustedOriginSet.has(origin)) {
    throw new APIError('FORBIDDEN', {
      message: `${rule.field} origin is not trusted`,
    });
  }
}
