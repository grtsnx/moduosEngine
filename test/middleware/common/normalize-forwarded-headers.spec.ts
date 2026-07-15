import type { NextFunction, Request, Response } from 'express';

import { normalizeForwardedHeaders } from 'src/middleware';

describe('normalizeForwardedHeaders', () => {
  it('collapses duplicate x-forwarded-proto values to the first entry', () => {
    const req = {
      headers: {
        'x-forwarded-proto': ['https', 'https'],
      },
    } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    normalizeForwardedHeaders(req, {} as Response, next);

    expect(req.headers['x-forwarded-proto']).toBe('https');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('collapses duplicate x-forwarded-host values to the first entry', () => {
    const req = {
      headers: {
        'x-forwarded-host': ['api.example.com', 'api.example.com'],
      },
    } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    normalizeForwardedHeaders(req, {} as Response, next);

    expect(req.headers['x-forwarded-host']).toBe('api.example.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('collapses comma-joined x-forwarded-proto strings to the first value', () => {
    // Node's HTTP parser joins duplicate headers into "https, https";
    // better-call then builds invalid URLs like `https, https://host/...`.
    const req = {
      headers: {
        'x-forwarded-proto': 'https, https',
        'x-forwarded-host': 'api.example.com, api.example.com',
      },
    } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    normalizeForwardedHeaders(req, {} as Response, next);

    expect(req.headers['x-forwarded-proto']).toBe('https');
    expect(req.headers['x-forwarded-host']).toBe('api.example.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('collapses array entries that themselves contain comma-joined values', () => {
    const req = {
      headers: {
        'x-forwarded-proto': ['https, https', 'https'],
      },
    } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    normalizeForwardedHeaders(req, {} as Response, next);

    expect(req.headers['x-forwarded-proto']).toBe('https');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('leaves single-value headers unchanged', () => {
    const req = {
      headers: {
        'x-forwarded-proto': 'https',
        'x-request-id': ['abc', 'def'],
      },
    } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    normalizeForwardedHeaders(req, {} as Response, next);

    expect(req.headers['x-forwarded-proto']).toBe('https');
    expect(req.headers['x-request-id']).toEqual(['abc', 'def']);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
