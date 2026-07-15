import { HttpException } from '@nestjs/common';

import {
  buildHandleResponseBody,
  getStatusType,
} from '../common/handle-response-body';

export class handleResponse extends HttpException {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: unknown,
  ) {
    super(buildHandleResponseBody(statusCode, message, data), statusCode);
  }

  getResponse(): Record<string, unknown> {
    return buildHandleResponseBody(
      this.getStatus(),
      this.message,
      this.data,
    ) as unknown as Record<string, unknown>;
  }

  getStatus(): number {
    return this.statusCode;
  }
}

export { getStatusType };
