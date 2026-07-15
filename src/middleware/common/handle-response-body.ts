import { HttpStatus } from '@nestjs/common';

const STATUS_NAMES = Object.entries(HttpStatus).reduce<Record<number, string>>(
  (acc, [key, value]) => {
    if (typeof value === 'number') {
      acc[value] = key;
    }
    return acc;
  },
  {},
);

export function getStatusType(statusCode: number): string {
  return STATUS_NAMES[statusCode] ?? 'UNKNOWN';
}

export interface HandleResponseBody {
  statusCode: number;
  statusType: string;
  message: string;
  data?: unknown;
}

export function buildHandleResponseBody(
  statusCode: number,
  message: string,
  data?: unknown,
): HandleResponseBody {
  const response: HandleResponseBody = {
    statusCode,
    statusType: getStatusType(statusCode),
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return response;
}

export function isHandleResponseBody(
  body: unknown,
): body is HandleResponseBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const record = body as Record<string, unknown>;
  return (
    typeof record.statusCode === 'number' &&
    typeof record.statusType === 'string' &&
    typeof record.message === 'string'
  );
}
