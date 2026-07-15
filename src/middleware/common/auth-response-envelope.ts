import { HttpStatus } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { isProxiedBetterAuthPath } from 'src/lib/betterauth/paths/auth-paths';
import { shouldSkipEnvelope } from 'src/lib/betterauth/response/redirect-paths';

import {
  buildHandleResponseBody,
  isHandleResponseBody,
} from './handle-response-body';

type EndChunk = Parameters<Response['end']>[0];
type EndCallback = () => void;

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

function parseJsonBody(
  body: string,
  contentTypeHeader: string | undefined,
): unknown {
  const contentType = contentTypeHeader?.toLowerCase() ?? '';
  const shouldAttemptJson =
    contentType.includes('application/json') || contentType.length === 0;

  if (!shouldAttemptJson) {
    return undefined;
  }

  const trimmed = body.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function isAuthRequest(path: string): boolean {
  return isProxiedBetterAuthPath(path);
}

function normalizeEnvelopeData(body: unknown): unknown {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (Object.keys(record).length === 0) {
      return undefined;
    }

    return body;
  }

  return { value: body };
}

function resolveEnvelopeMessage(statusCode: number, body: unknown): string {
  if (typeof body === 'string' && body.trim().length > 0) {
    return body.trim();
  }

  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    if (
      typeof record.message === 'string' &&
      record.message.trim().length > 0
    ) {
      return record.message;
    }
  }

  if (statusCode >= 400) {
    return HttpStatus[statusCode] ?? 'Request failed';
  }

  return 'Request completed successfully';
}

function parseJsonChunk(
  chunk: unknown,
  contentTypeHeader: string | undefined,
): unknown {
  if (chunk === undefined || chunk === null) {
    return undefined;
  }

  if (typeof chunk === 'object' && !Buffer.isBuffer(chunk)) {
    return chunk;
  }

  const buffer = chunkToBuffer(chunk);
  if (!buffer) {
    return undefined;
  }

  return parseJsonBody(buffer.toString('utf8'), contentTypeHeader);
}

function resolveEndEncoding(cbOrEncoding: unknown): BufferEncoding | undefined {
  if (typeof cbOrEncoding === 'string') {
    return cbOrEncoding as BufferEncoding;
  }
  return undefined;
}

function resolveEndCallback(
  cbOrEncoding: unknown,
  cb: unknown,
): EndCallback | undefined {
  if (typeof cbOrEncoding === 'function') {
    return cbOrEncoding as EndCallback;
  }

  if (typeof cb === 'function') {
    return cb as EndCallback;
  }

  return undefined;
}

function callResponseEnd(
  end: Response['end'],
  chunk: EndChunk,
  encoding: BufferEncoding | undefined,
  callback: EndCallback | undefined,
): Response {
  if (chunk === undefined) {
    return callback ? end(callback) : end();
  }

  if (encoding !== undefined) {
    return callback ? end(chunk, encoding, callback) : end(chunk, encoding);
  }

  return callback ? end(chunk, callback) : end(chunk);
}

export function authResponseEnvelope(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isAuthRequest(req.path) || shouldSkipEnvelope(req.path)) {
    next();
    return;
  }

  const originalEnd = res.end.bind(res);
  const originalWrite = res.write.bind(res);
  const chunks: Buffer[] = [];

  res.write = ((chunk: unknown, ...args: unknown[]): boolean => {
    const buffer = chunkToBuffer(chunk);
    if (buffer && buffer.length > 0) {
      chunks.push(buffer);
    }

    return (originalWrite as (...writeArgs: unknown[]) => boolean)(
      chunk,
      ...args,
    );
  }) as Response['write'];

  res.end = ((
    chunk?: EndChunk,
    cbOrEncoding?: unknown,
    cb?: unknown,
  ): Response => {
    const encoding = resolveEndEncoding(cbOrEncoding);
    const callback = resolveEndCallback(cbOrEncoding, cb);
    const endBuffer = chunkToBuffer(chunk);
    if (endBuffer && endBuffer.length > 0) {
      chunks.push(endBuffer);
    }

    const contentType = res.getHeader('content-type')?.toString();
    const bodyText =
      chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : '';
    const parsed =
      bodyText.length > 0
        ? parseJsonBody(bodyText, contentType)
        : parseJsonChunk(chunk, contentType);

    if (parsed !== undefined && isHandleResponseBody(parsed)) {
      if (parsed.statusCode !== res.statusCode) {
        res.statusCode = parsed.statusCode;
      }

      return callResponseEnd(originalEnd, chunk, encoding, callback);
    }

    if (parsed !== undefined) {
      const statusCode = res.statusCode || HttpStatus.OK;
      const message = resolveEnvelopeMessage(statusCode, parsed);
      const data = normalizeEnvelopeData(parsed);
      const wrapped = buildHandleResponseBody(statusCode, message, data);
      const serialized = JSON.stringify(wrapped);

      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('content-length', Buffer.byteLength(serialized).toString());

      return callResponseEnd(originalEnd, serialized, encoding, callback);
    }

    return callResponseEnd(originalEnd, chunk, encoding, callback);
  }) as Response['end'];

  next();
}
