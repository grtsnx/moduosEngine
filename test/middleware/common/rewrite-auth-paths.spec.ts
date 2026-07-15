import type { Request, Response } from 'express';

import {
  API_ROUTE_REWRITES,
  adminPath,
  authPath,
  organisationPath,
  teamsPath,
  userPath,
} from 'src/lib';
import { rewriteAuthPaths } from 'src/middleware';

function createReq(path: string, url: string): Request {
  return { path, url, originalUrl: url } as Request;
}

describe('rewriteAuthPaths', () => {
  it.each(
    API_ROUTE_REWRITES.filter((entry) =>
      entry.public.startsWith('/v1/api/auth/'),
    ).map((entry) => [entry.public, entry.internal]),
  )('rewrites auth public %s to internal %s', (publicPath, internalPath) => {
    const req = createReq(publicPath, publicPath);
    const next = jest.fn();

    rewriteAuthPaths(req, {} as Response, next);

    expect(req.url).toBe(internalPath);
    expect(next).toHaveBeenCalled();
  });

  it('rewrites user profile to get-session', () => {
    const publicPath = userPath('/profile');
    const req = createReq(publicPath, publicPath);
    const next = jest.fn();

    rewriteAuthPaths(req, {} as Response, next);

    expect(req.url).toBe(authPath('/get-session'));
    expect(req.originalUrl).toBe(authPath('/get-session'));
    expect(next).toHaveBeenCalled();
  });

  it('rewrites organisation create to internal organization path', () => {
    const publicPath = organisationPath('/create');
    const req = createReq(publicPath, publicPath);
    const next = jest.fn();

    rewriteAuthPaths(req, {} as Response, next);

    expect(req.url).toBe(authPath('/organization/create'));
    expect(next).toHaveBeenCalled();
  });

  it('rewrites teams create to internal organization team path', () => {
    const publicPath = teamsPath('/create');
    const req = createReq(publicPath, publicPath);
    const next = jest.fn();

    rewriteAuthPaths(req, {} as Response, next);

    expect(req.url).toBe(authPath('/organization/create-team'));
    expect(next).toHaveBeenCalled();
  });

  it('rewrites admin list users to internal admin path', () => {
    const publicPath = adminPath('/list/users');
    const req = createReq(publicPath, publicPath);
    const next = jest.fn();

    rewriteAuthPaths(req, {} as Response, next);

    expect(req.url).toBe(authPath('/admin/list-users'));
    expect(next).toHaveBeenCalled();
  });

  it('preserves query strings while rewriting', () => {
    const publicPath = authPath('/two/factor/verify');
    const req = createReq(publicPath, `${publicPath}?next=%2Fdashboard`);
    const next = jest.fn();

    rewriteAuthPaths(req, {} as Response, next);

    expect(req.url).toBe(
      `${authPath('/two-factor/verify-totp')}?next=%2Fdashboard`,
    );
    expect(next).toHaveBeenCalled();
  });

  it('leaves non-auth paths unchanged', () => {
    const req = createReq('/health', '/health');
    const next = jest.fn();

    rewriteAuthPaths(req, {} as Response, next);

    expect(req.url).toBe('/health');
    expect(next).toHaveBeenCalled();
  });

  it('leaves single-segment auth paths unchanged', () => {
    const req = createReq(authPath('/ok'), authPath('/ok'));
    const next = jest.fn();

    rewriteAuthPaths(req, {} as Response, next);

    expect(req.url).toBe(authPath('/ok'));
    expect(next).toHaveBeenCalled();
  });

  it('returns 404 for legacy hyphenated internal auth paths', () => {
    const req = createReq(
      authPath('/sign-up/email'),
      authPath('/sign-up/email'),
    );
    const res = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const next = jest.fn();

    rewriteAuthPaths(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.type).toHaveBeenCalledWith('application/json');
    expect(res.send).toHaveBeenCalledWith(
      JSON.stringify({
        statusCode: 404,
        statusType: 'NOT_FOUND',
        message: 'Not Found',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 for legacy auth-prefixed user routes', () => {
    const req = createReq(authPath('/update/user'), authPath('/update/user'));
    const res = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const next = jest.fn();

    rewriteAuthPaths(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.type).toHaveBeenCalledWith('application/json');
    expect(res.send).toHaveBeenCalledWith(
      JSON.stringify({
        statusCode: 404,
        statusType: 'NOT_FOUND',
        message: 'Not Found',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
