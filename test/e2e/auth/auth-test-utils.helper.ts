import type { TestHelpers } from 'better-auth/plugins';
import type { PrismaClient } from 'generated/prisma/client';

import {
  buildTestAuth,
  getTestHelpers,
  type Auth,
} from 'src/lib/betterauth/testing/auth-test';

export async function createTestAuth(
  prisma: PrismaClient,
): Promise<{ auth: Auth; test: TestHelpers }> {
  const auth = buildTestAuth(prisma, { captureOTP: true });
  const test = await getTestHelpers(auth);
  return { auth, test };
}

export async function loginTestUser(
  test: TestHelpers,
  userId: string,
): Promise<{
  headers: Headers;
  token: string;
}> {
  const { headers, token } = await test.login({ userId });
  return { headers, token };
}

async function waitForOtp(
  test: TestHelpers,
  email: string,
  attempts = 25,
  delayMs = 120,
): Promise<string> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const otp = test.getOTP?.(email);
    if (otp) {
      return otp;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`No OTP captured for ${email}`);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}

function unwrapEnvelope(value: unknown): {
  statusCode: number | null;
  message: string | null;
  payload: unknown;
} {
  const record = asRecord(value);
  if (!record) {
    return { statusCode: null, message: null, payload: value };
  }

  const statusCode =
    typeof record.statusCode === 'number' ? record.statusCode : null;
  const message = typeof record.message === 'string' ? record.message : null;

  if ('data' in record) {
    return { statusCode, message, payload: record.data };
  }

  return { statusCode, message, payload: value };
}

function extractOtp(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const otp = record.otp;
  if (typeof otp === 'string' && otp.trim().length > 0) {
    return otp;
  }

  return null;
}

export async function captureAndVerifyOtp(
  test: TestHelpers,
  auth: Auth,
  email: string,
): Promise<string> {
  test.clearOTPs?.();

  const emailOtpApi = auth.api as unknown as {
    createVerificationOTP?: (options: {
      body: { email: string; type: 'email-verification' };
    }) => Promise<unknown>;
    sendVerificationOTP: (options: {
      body: { email: string; type: 'email-verification' };
    }) => Promise<unknown>;
    verifyEmailOTP: (options: {
      body: { email: string; otp: string };
    }) => Promise<unknown>;
  };

  let otp: string | null = null;

  if (emailOtpApi.createVerificationOTP) {
    const createdRaw = await emailOtpApi.createVerificationOTP({
      body: { email, type: 'email-verification' },
    });
    const created = unwrapEnvelope(createdRaw);

    if (created.statusCode !== null && created.statusCode >= 400) {
      throw new Error(
        `createVerificationOTP failed for ${email}: ${created.message ?? 'unknown error'}`,
      );
    }

    otp = extractOtp(created.payload) ?? extractOtp(createdRaw);
  }

  if (!otp) {
    await emailOtpApi.sendVerificationOTP({
      body: { email, type: 'email-verification' },
    });
    otp = await waitForOtp(test, email);

    if (!/^\d{6}$/.test(otp)) {
      throw new Error(
        `Captured OTP is not a plain 6-digit code for ${email}; got '${otp.slice(0, 12)}...'`,
      );
    }
  }

  const verifyRaw = await emailOtpApi.verifyEmailOTP({
    body: { email, otp },
  });
  const verified = unwrapEnvelope(verifyRaw);
  if (verified.statusCode !== null && verified.statusCode >= 400) {
    throw new Error(
      `verifyEmailOTP failed for ${email}: ${verified.message ?? 'unknown error'}`,
    );
  }

  return otp;
}
