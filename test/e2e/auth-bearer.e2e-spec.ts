import request from 'supertest';

import { bearerTokenResponse } from 'test/fixtures';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  getPrismaClient,
  isAuthIntegrationE2e,
  signInUser,
  signUpUser,
  verifyUserEmail,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Bearer (e2e) without database', () => {
  it('does not mount bearer token routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer()).get(authPath('/token')).expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Bearer (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('GET /v1/api/auth/token requires session with envelope', async () => {
    const response = await request(app.getHttpServer()).get(authPath('/token'));

    expect([401, 403, 404]).toContain(response.status);
    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(bearerTokenResponse);
  });

  it.skip('GET /v1/api/auth/token returns token envelope after sign-in', async () => {
    const agent = request.agent(app.getHttpServer());
    const prisma = getPrismaClient(app);
    const user = await signUpUser(agent);
    await verifyUserEmail(agent, prisma, user.email);
    await signInUser(agent, user.email, user.password);

    const response = await agent.get(authPath('/token'));

    expectEnvelopeFields(response.body);
    expect(
      (response.body as { data?: { token?: string } }).data?.token,
    ).toEqual(expect.any(String));
  });
});
