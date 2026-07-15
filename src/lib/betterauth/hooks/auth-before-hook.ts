import { APIError } from 'better-auth/api';

import { wrapAuthError } from '../response/response-envelope';
import { assertTrustedAuthCallbackOrRedirect } from './request-url-guard';
import { handleAuthPasswordValidation } from './sign-up-validation';

export function runAuthBeforeRequest(
  path: string,
  body: unknown,
  trustedOrigins: string[],
): void {
  assertTrustedAuthCallbackOrRedirect(path, body, trustedOrigins);
  handleAuthPasswordValidation(path, body);
}

export function wrapAuthBeforeError(
  error: unknown,
): ReturnType<typeof wrapAuthError> | null {
  if (error instanceof APIError) {
    return wrapAuthError(error);
  }

  return null;
}
