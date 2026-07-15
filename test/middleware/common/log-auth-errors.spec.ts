import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { logAuthErrors } from 'src/middleware';

interface MockResponse extends Partial<Response> {
  end: Response['end'];
  write: Response['write'];
  on: jest.Mock;
  statusCode: number;
}

describe('logAuthErrors', () => {
  function setup(path: string): {
    res: MockResponse;
    next: NextFunction;
    finish: () => void;
  } {
    let finishHandler: (() => void) | undefined;
    const writeMock = jest.fn().mockReturnValue(true);
    const endMock = jest.fn().mockReturnThis();
    const req = {
      path,
      method: 'POST',
      originalUrl: path,
    } as Request;
    const res = {
      statusCode: 400,
      write: writeMock as Response['write'],
      end: endMock as Response['end'],
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
        return res;
      }),
    } as unknown as MockResponse;
    const next = jest.fn() as unknown as NextFunction;

    logAuthErrors(req, res as Response, next);

    return {
      res,
      next,
      finish: () => {
        finishHandler?.();
      },
    };
  }

  it('captures Uint8Array response bodies from Better Auth streaming', () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const { res, finish } = setup('/v1/api/auth/email-otp/verify-email');
    const payload = JSON.stringify({
      statusCode: 400,
      statusType: 'BAD_REQUEST',
      message: 'Invalid OTP',
    });

    res.write(new TextEncoder().encode(payload));
    res.end();
    finish();

    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('body={"statusCode":400'),
    );

    loggerError.mockRestore();
  });

  it('captures string response bodies', () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const { res, finish } = setup('/v1/api/auth/email-otp/verify-email');

    res.end('{"message":"Invalid OTP"}');
    finish();

    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('body={"message":"Invalid OTP"}'),
    );

    loggerError.mockRestore();
  });
});
