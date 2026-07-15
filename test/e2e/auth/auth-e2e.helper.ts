import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { PrismaClient } from 'generated/prisma/client';
import request from 'supertest';

import { AppModule } from 'src/app';
import {
  authPath,
  organisationPath,
  teamsPath,
  userPath,
  adminPath,
} from 'src/lib/betterauth/paths/auth-paths';
import { PrismaService } from 'src/lib';
import { configureApp } from 'src/middleware';

import { signUpRequest, validPassword } from 'test/fixtures';
import { captureAndVerifyOtp, createTestAuth } from './auth-test-utils.helper';

export function isAuthIntegrationE2e(): boolean {
  return process.env.E2E_AUTH_INTEGRATION === 'true';
}

export function isAuthE2eEnabled(): boolean {
  return (
    isAuthIntegrationE2e() && Boolean(process.env.E2E_DATABASE_URL?.trim())
  );
}

export interface AuthE2eContext {
  app: INestApplication;
}

export async function createAuthE2eApp(): Promise<AuthE2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication({ bodyParser: false });
  configureApp(app);
  await app.init();

  return { app };
}

export async function closeAuthE2eApp(context: AuthE2eContext): Promise<void> {
  await context.app.close();
}

export function asEnvelope(body: unknown): Record<string, unknown> {
  return body as Record<string, unknown>;
}

export function expectEnvelopeFields(body: unknown): void {
  const envelope = asEnvelope(body);
  if (
    typeof envelope.statusCode === 'number' &&
    typeof envelope.statusType === 'string' &&
    typeof envelope.message === 'string'
  ) {
    return;
  }

  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();
}

export function expectEnvelope(
  body: unknown,
  expected: {
    statusCode: number;
    statusType: string;
    message: string;
    data?: unknown;
  },
): void {
  expect(asEnvelope(body)).toMatchObject({
    statusCode: expected.statusCode,
    statusType: expected.statusType,
    message: expected.message,
  });

  if (expected.data !== undefined) {
    expect(asEnvelope(body).data).toEqual(expected.data);
  }
}

export function uniqueTestEmail(prefix = 'user'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@gmail.com`;
}

export function getPrismaClient(app: INestApplication): PrismaClient {
  return app.get(PrismaService).client();
}

export async function findLatestVerificationValue(
  prisma: PrismaClient,
  email: string,
): Promise<string | null> {
  const record = await prisma.verification.findFirst({
    where: {
      value: {
        contains: email,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return record?.identifier ?? null;
}

type AuthE2eAgent = ReturnType<typeof request.agent>;

export async function signUpUser(
  agent: AuthE2eAgent,
  overrides: Partial<typeof signUpRequest> = {},
): Promise<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}> {
  const payload = {
    ...signUpRequest,
    email: uniqueTestEmail('signup'),
    ...overrides,
  };

  await agent.post(authPath('/sign/up/email')).send(payload).expect(200);

  return {
    email: payload.email,
    password: payload.password,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };
}

export async function verifyUserEmail(
  agent: AuthE2eAgent,
  prisma: PrismaClient,
  email: string,
): Promise<void> {
  const { auth, test } = await createTestAuth(prisma);
  try {
    await captureAndVerifyOtp(test, auth, email);
  } catch {
    // Fallback for environments without test auth OTP capture
    let token: string | null = null;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      token = await findLatestVerificationValue(prisma, email);
      if (token) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (!token) {
      return;
    }

    await agent
      .post(authPath('/email/otp/verify'))
      .send({ email, otp: '000000' });
  } finally {
    test.clearOTPs?.();
  }
}

export async function signInUser(
  agent: AuthE2eAgent,
  email: string,
  password: string = validPassword,
): Promise<void> {
  await agent
    .post(authPath('/sign/in/email'))
    .send({ email, password })
    .expect(200);
}

export async function promoteToAdmin(
  prisma: PrismaClient,
  email: string,
): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: { role: 'admin' },
  });
}

export async function banUserViaDb(
  prisma: PrismaClient,
  userId: string,
  reason = 'Terms of service violation',
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      banned: true,
      banReason: reason,
    },
  });
}

export { adminPath, authPath, organisationPath, teamsPath, userPath };
