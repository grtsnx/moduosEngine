import { APIError } from 'better-auth/api';

export const STRONG_PASSWORD_MIN_LENGTH = 12;
export const STRONG_PASSWORD_MAX_LENGTH = 256;

export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,256}$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readNonEmptyString(
  payload: Record<string, unknown>,
  field: string,
): string {
  const value = payload[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new APIError('BAD_REQUEST', {
      message: `${field} is required`,
    });
  }

  return value.trim();
}

export function composeDisplayName(
  firstName: string,
  lastName: string,
): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function assertStrongPassword(password: unknown): void {
  if (typeof password !== 'string') {
    throw new APIError('BAD_REQUEST', { message: 'Password is required' });
  }

  if (password.length < STRONG_PASSWORD_MIN_LENGTH) {
    throw new APIError('BAD_REQUEST', {
      message: `Password must be at least ${STRONG_PASSWORD_MIN_LENGTH} characters`,
    });
  }

  if (password.length > STRONG_PASSWORD_MAX_LENGTH) {
    throw new APIError('BAD_REQUEST', {
      message: `Password must be at most ${STRONG_PASSWORD_MAX_LENGTH} characters`,
    });
  }

  if (!STRONG_PASSWORD_PATTERN.test(password)) {
    throw new APIError('BAD_REQUEST', {
      message:
        'Password must include uppercase, lowercase, number, and special character',
    });
  }
}

export function assertSignUpBody(body: unknown): void {
  const payload = asRecord(body);
  if (!payload) {
    throw new APIError('BAD_REQUEST', { message: 'Invalid sign-up payload' });
  }

  readNonEmptyString(payload, 'firstName');
  readNonEmptyString(payload, 'lastName');

  const password = payload.password;
  assertStrongPassword(password);

  if (
    payload.confirmPassword === undefined ||
    payload.confirmPassword === null
  ) {
    throw new APIError('BAD_REQUEST', {
      message: 'confirmPassword is required',
    });
  }

  if (payload.confirmPassword !== password) {
    throw new APIError('BAD_REQUEST', {
      message: 'confirmPassword must match password',
    });
  }
}

export function normalizeSignUpBody(body: unknown): void {
  const payload = asRecord(body);
  if (!payload) {
    return;
  }

  const firstName = readNonEmptyString(payload, 'firstName');
  const lastName = readNonEmptyString(payload, 'lastName');
  payload.name = composeDisplayName(firstName, lastName);
  delete payload.confirmPassword;
}

export function handleAuthPasswordValidation(
  path: string,
  body: unknown,
): void {
  if (path === '/sign-up/email') {
    assertSignUpBody(body);
    normalizeSignUpBody(body);
    return;
  }

  if (path === '/reset-password') {
    const payload = asRecord(body);
    if (payload?.newPassword !== undefined) {
      assertStrongPassword(payload.newPassword);
    }
  }
}
