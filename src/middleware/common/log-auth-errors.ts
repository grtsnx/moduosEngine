import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { isProxiedBetterAuthPath } from 'src/lib/betterauth/paths/auth-paths';

/**
 * TEMPORARY debug middleware: logs every auth response with status >= 400,
 * including the response body, so silent 5xx responses can be traced to the
 * layer that produced them. Remove once the dash 500s are resolved.
 */
const authErrorLogger = new Logger('AuthDebug');

function isAuthPath(path: string): boolean {
  return isProxiedBetterAuthPath(path);
}

function chunkToBuffer(chunk: unknown): Buffer | undefined {
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }

  if (typeof chunk === 'string') {
    return Buffer.from(chunk);
  }

  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk);
  }

  if (ArrayBuffer.isView(chunk)) {
    return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }

  if (chunk instanceof ArrayBuffer) {
    return Buffer.from(chunk);
  }

  return undefined;
}

export function logAuthErrors(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isAuthPath(req.path)) {
    next();
    return;
  }

  const startedAt = Date.now();
  const chunks: Buffer[] = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  const capture = (chunk: unknown): void => {
    const buffer = chunkToBuffer(chunk);
    if (buffer && buffer.length > 0) {
      chunks.push(buffer);
    }
  };

  res.write = ((chunk: unknown, ...args: unknown[]): boolean => {
    capture(chunk);
    return (originalWrite as (...a: unknown[]) => boolean)(chunk, ...args);
  }) as Response['write'];

  res.end = ((chunk: unknown, ...args: unknown[]): Response => {
    capture(chunk);
    return (originalEnd as (...a: unknown[]) => Response)(chunk, ...args);
  }) as Response['end'];

  res.on('finish', () => {
    if (res.statusCode < 400) {
      return;
    }

    const body = Buffer.concat(chunks).toString('utf8').slice(0, 500);
    authErrorLogger.error(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms) body=${body || '<empty>'}`,
    );
  });

  next();
}
