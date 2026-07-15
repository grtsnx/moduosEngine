import request from 'supertest';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  getPrismaClient,
  isAuthIntegrationE2e,
  signUpUser,
  userPath,
} from './auth/auth-e2e.helper';
import {
  captureAndVerifyOtp,
  createTestAuth,
  loginTestUser,
} from './auth/auth-test-utils.helper';

function extractCookieHeader(headers: Headers): string {
  const direct = headers.get('cookie');
  if (direct && direct.trim().length > 0) {
    return direct;
  }

  const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] })
    .getSetCookie;
  if (typeof getSetCookie === 'function') {
    const fromArray = getSetCookie();
    if (fromArray.length > 0) {
      return fromArray[0]?.split(';')[0] ?? '';
    }
  }

  const setCookie = headers.get('set-cookie');
  if (setCookie && setCookie.trim().length > 0) {
    return setCookie.match(/^[^;]+/)?.[0] ?? '';
  }

  return '';
}

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Test Utils (e2e) without database', () => {
  it('does not mount auth when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer()).get(authPath('/ok')).expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Test Utils (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('creates a user via test helpers and authenticates to profile', async () => {
    const prisma = getPrismaClient(app);
    const { auth, test } = await createTestAuth(prisma);

    const user = test.createUser({
      email: `test-utils-${Date.now()}@gmail.com`,
      firstName: 'Test',
      lastName: 'Utils',
      password: 'SecurePass123!',
    });
    const savedUser = await test.saveUser(user);

    const { headers } = await loginTestUser(test, savedUser.id);
    await auth.api.getSession({ headers });

    const cookieHeader = extractCookieHeader(headers);
    const response = await request(app.getHttpServer())
      .get(userPath('/profile'))
      .set('Cookie', cookieHeader)
      .expect(200);

    expectEnvelopeFields(response.body);

    await test.deleteUser(savedUser.id);
  });

  it('captures OTP and verifies email via test utils', async () => {
    const agent = request.agent(app.getHttpServer());
    const prisma = getPrismaClient(app);
    const { email } = await signUpUser(agent);
    const { auth, test } = await createTestAuth(prisma);

    const otp = await captureAndVerifyOtp(test, auth, email);
    expect(otp.length).toBeGreaterThanOrEqual(6);

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });
    expect(dbUser?.emailVerified).toBe(true);
  });
});
