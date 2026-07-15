import type { NextFunction, Request, Response } from 'express';

/** Headers where duplicate proxy values must collapse to a single entry. */
const SINGLE_VALUE_FORWARDED_HEADERS = [
  'x-forwarded-proto',
  'x-forwarded-host',
] as const;

function firstHeaderValue(value: string): string {
  const commaIndex = value.indexOf(',');
  const first = commaIndex >= 0 ? value.slice(0, commaIndex) : value;
  return first.trim();
}

/**
 * ngrok and Better Auth Infrastructure both set `x-forwarded-proto`.
 * Node's HTTP parser joins duplicate headers into a comma-separated string
 * (`"https, https"`), and some clients send arrays; better-call then builds
 * invalid URLs like `https, https://host/...` and auth routes return 500.
 * Collapse both shapes to the first value.
 */
export function normalizeForwardedHeaders(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  for (const header of SINGLE_VALUE_FORWARDED_HEADERS) {
    const value = req.headers[header];

    if (Array.isArray(value) && value.length > 0) {
      req.headers[header] = firstHeaderValue(value[0] ?? '');
    } else if (typeof value === 'string' && value.includes(',')) {
      req.headers[header] = firstHeaderValue(value);
    }
  }

  next();
}
