import { HttpStatus } from '@nestjs/common';
import { APIError } from 'better-auth/api';

import { buildHandleResponseBody } from '../../../middleware/common/handle-response-body';

import {
  AUTH_BASE_PATH,
  isProxiedBetterAuthPath,
  toBetterAuthRelativePath,
} from '../paths/auth-paths';
import { resolveSuccessMessage } from './response-messages';

const API_ERROR_STATUS_MAP: Record<string, number> = {
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  METHOD_NOT_ALLOWED: HttpStatus.METHOD_NOT_ALLOWED,
  CONFLICT: HttpStatus.CONFLICT,
  UNPROCESSABLE_ENTITY: HttpStatus.UNPROCESSABLE_ENTITY,
  TOO_MANY_REQUESTS: HttpStatus.TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

export function mapApiErrorStatus(error: APIError): number {
  const mapped = API_ERROR_STATUS_MAP[error.status];
  return mapped ?? HttpStatus.BAD_REQUEST;
}

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

function unwrapAuthReturned(returned: unknown): unknown {
  if (typeof returned === 'object' && returned !== null && 'body' in returned) {
    return (returned as { body?: unknown }).body ?? returned;
  }

  return returned;
}

function isEmptySessionPayload(returned: unknown): boolean {
  const unwrapped = unwrapAuthReturned(returned);

  if (unwrapped === null || unwrapped === undefined) {
    return true;
  }

  if (typeof unwrapped !== 'object') {
    return false;
  }

  const record = unwrapped as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) {
    return true;
  }

  const hasSessionKey = 'session' in record;
  if (!hasSessionKey) {
    return true;
  }

  return record.session === null || record.session === undefined;
}

function normalizeLegacyAuthData(path: string, data: unknown): unknown {
  const normalizedPath = normalizeAuthPath(path);

  if (normalizedPath === '/ok') {
    if (
      typeof data === 'object' &&
      data !== null &&
      (data as Record<string, unknown>).ok === true
    ) {
      return { status: 'ok' };
    }
  }

  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.status === 'boolean' && record.success === undefined) {
      const { status, ...rest } = record;
      const withoutMessage = Object.fromEntries(
        Object.entries(rest).filter(([key]) => key !== 'message'),
      );
      return { ...withoutMessage, success: status };
    }
  }

  return data;
}

export function isMissingAuthSession(path: string, returned: unknown): boolean {
  const normalizedPath = normalizeAuthPath(path);
  return normalizedPath === '/get-session' && isEmptySessionPayload(returned);
}

export function wrapAuthData(path: string, returned: unknown): unknown {
  let base: unknown = returned;

  if (returned === null || returned === undefined) {
    return returned;
  }

  if (typeof returned === 'object' && returned !== null && 'body' in returned) {
    const body = (returned as { body?: unknown }).body;
    base = body ?? returned;
  }

  return normalizeLegacyAuthData(path, base);
}

export function wrapMissingAuthSessionError(): ReturnType<
  typeof buildHandleResponseBody
> {
  return wrapAuthError(
    new APIError('UNAUTHORIZED', { message: 'Unauthorized' }),
  );
}

export function resolveAuthMessage(path: string): {
  statusCode: number;
  message: string;
} {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (normalized === '/ok') {
    return {
      statusCode: HttpStatus.OK,
      message: resolveSuccessMessage(normalized),
    };
  }

  return {
    statusCode: HttpStatus.OK,
    message: resolveSuccessMessage(normalized),
  };
}

export function wrapAuthSuccess(
  path: string,
  returned: unknown,
): ReturnType<typeof buildHandleResponseBody> {
  const { statusCode, message } = resolveAuthMessage(path);
  return buildHandleResponseBody(
    statusCode,
    message,
    wrapAuthData(path, returned),
  );
}

export function wrapAuthError(
  error: APIError,
): ReturnType<typeof buildHandleResponseBody> {
  const statusCode = mapApiErrorStatus(error);
  return buildHandleResponseBody(statusCode, error.message);
}
