import request from 'supertest';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  getPrismaClient,
  isAuthIntegrationE2e,
  signInUser,
  signUpUser,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Last Login Method (e2e) without database', () => {
  it('does not mount sign-in when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(authPath('/sign/in/email'))
      .send({ email: 'user@example.com', password: 'SecurePass123!' })
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Last Login Method (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('persists email as lastLoginMethod after sign-in', async () => {
    const agent = request.agent(app.getHttpServer());
    const prisma = getPrismaClient(app);
    const user = await signUpUser(agent);

    await signInUser(agent, user.email, user.password);

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { lastLoginMethod: true },
    });

    expect(dbUser?.lastLoginMethod).toBe('email');
  });
});
