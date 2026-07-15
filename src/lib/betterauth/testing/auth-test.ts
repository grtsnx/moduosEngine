import { testUtils } from 'better-auth/plugins';
import type { TestHelpers } from 'better-auth/plugins';
import type { PrismaClient } from 'generated/prisma/client';

import { buildAuth, type Auth } from '../core/auth-options';

export type { Auth };

export interface BuildTestAuthOptions {
  captureOTP?: boolean;
}

/**
 * Test-only auth instance with Better Auth testUtils plugin.
 * Do not use in production — exposes privileged helpers on ctx.test.
 */
export function buildTestAuth(
  prisma: PrismaClient,
  options: BuildTestAuthOptions = {},
): Auth {
  return buildAuth(prisma, {
    extraPlugins: [
      testUtils({
        captureOTP: options.captureOTP ?? true,
      }),
    ],
  });
}

export async function getTestHelpers(auth: Auth): Promise<TestHelpers> {
  const ctx = await auth.$context;
  const test = (ctx as { test?: TestHelpers }).test;
  if (!test) {
    throw new Error('testUtils plugin is not enabled on this auth instance');
  }
  return test;
}
