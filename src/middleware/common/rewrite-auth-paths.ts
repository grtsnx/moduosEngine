import { HttpStatus } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import {
  buildAuthPathRewriteMap,
  buildLegacyAuthInternalPathSet,
} from 'src/lib/betterauth/paths/auth-paths';

import { buildHandleResponseBody } from './handle-response-body';

const AUTH_PATH_REWRITES = buildAuthPathRewriteMap();
const LEGACY_AUTH_INTERNAL_PATHS = buildLegacyAuthInternalPathSet();

export function rewriteAuthPaths(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const rewrittenPath = AUTH_PATH_REWRITES.get(req.path);
  if (rewrittenPath) {
    const queryIndex = req.url.indexOf('?');
    const querySuffix = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
    const rewrittenUrl = `${rewrittenPath}${querySuffix}`;
    req.url = rewrittenUrl;
    req.originalUrl = rewrittenUrl;

    next();
    return;
  }

  if (LEGACY_AUTH_INTERNAL_PATHS.has(req.path)) {
    const body = buildHandleResponseBody(HttpStatus.NOT_FOUND, 'Not Found');
    res
      .status(HttpStatus.NOT_FOUND)
      .type('application/json')
      .send(JSON.stringify(body));
    return;
  }

  next();
}
