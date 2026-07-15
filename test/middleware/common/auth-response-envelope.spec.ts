import type { NextFunction, Request, Response } from 'express';

import { authResponseEnvelope } from 'src/middleware';

interface MockResponse extends Partial<Response> {
  end: Response['end'];
  write: Response['write'];
  getHeader: jest.Mock;
  setHeader: jest.Mock;
  statusCode: number;
}

function setup(
  path: string,
  statusCode = 400,
): {
  res: MockResponse;
  endMock: jest.Mock;
  writeMock: jest.Mock;
  next: NextFunction;
} {
  const req = { path } as Request;
  const endMock = jest.fn();
  const writeMock = jest.fn(() => true);
  const res = {
    statusCode,
    end: endMock as Response['end'],
    write: writeMock as Response['write'],
    getHeader: jest.fn(() => undefined),
    setHeader: jest.fn(),
  } as unknown as MockResponse;
  const next = jest.fn() as unknown as NextFunction;

  authResponseEnvelope(req, res as Response, next);

  return { res, endMock, writeMock, next };
}

describe('authResponseEnvelope', () => {
  it('wraps raw auth JSON responses at the end phase', () => {
    const { res, endMock } = setup('/v1/api/auth/sign-in/social', 403);

    res.end(JSON.stringify({ message: 'Invalid callbackURL' }));

    expect(res.setHeader).toHaveBeenCalledWith(
      'content-type',
      'application/json; charset=utf-8',
    );
    expect(endMock).toHaveBeenCalledWith(
      JSON.stringify({
        statusCode: 403,
        statusType: 'FORBIDDEN',
        message: 'Invalid callbackURL',
        data: { message: 'Invalid callbackURL' },
      }),
    );
  });

  it('does not re-wrap existing handleResponse payloads', () => {
    const { res, endMock } = setup('/v1/api/auth/sign-in/email', 200);
    const body = {
      statusCode: 200,
      statusType: 'OK',
      message: 'Signed in successfully',
      data: { user: { id: 'usr_1' } },
    };

    res.end(JSON.stringify(body));

    expect(endMock).toHaveBeenCalledWith(JSON.stringify(body));
  });

  it('syncs HTTP status from existing handleResponse payloads', () => {
    const { res, endMock } = setup('/v1/api/user/profile', 200);
    const body = {
      statusCode: 401,
      statusType: 'UNAUTHORIZED',
      message: 'Unauthorized',
    };

    res.end(JSON.stringify(body));

    expect(res.statusCode).toBe(401);
    expect(endMock).toHaveBeenCalledWith(JSON.stringify(body));
  });

  it('syncs HTTP status from streamed handleResponse payloads', () => {
    const { res, endMock } = setup('/v1/api/user/profile', 200);
    const body = {
      statusCode: 401,
      statusType: 'UNAUTHORIZED',
      message: 'Unauthorized',
    };
    const serialized = JSON.stringify(body);

    res.write(serialized.slice(0, 20));
    res.end(serialized.slice(20));

    expect(res.statusCode).toBe(401);
    expect(endMock).toHaveBeenCalledWith(serialized.slice(20));
  });

  it('skips non-auth routes', () => {
    const { res, endMock } = setup('/v1/api/health', 400);

    res.end(JSON.stringify({ message: 'raw body' }));

    expect(endMock).toHaveBeenCalledWith(
      JSON.stringify({ message: 'raw body' }),
    );
  });
});
