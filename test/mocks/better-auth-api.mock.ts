export class APIError extends Error {
  readonly status: string;

  constructor(status: string, options?: { message?: string }) {
    super(options?.message ?? status);
    this.status = status;
    this.name = 'APIError';
  }
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function createAuthMiddleware(
  handler: (...args: unknown[]) => unknown,
): (...args: unknown[]) => unknown {
  return handler;
}
