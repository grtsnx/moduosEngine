import request from 'supertest';

import { compromisedPassword, signUpRequest } from 'test/fixtures';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  isAuthIntegrationE2e,
  uniqueTestEmail,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth HIBP (e2e) without database', () => {
  it('does not mount sign-up when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send(signUpRequest)
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth HIBP (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];
  const originalHibpEnabled = process.env.BETTER_AUTH_HIBP_ENABLED;

  beforeEach(async () => {
    process.env.BETTER_AUTH_HIBP_ENABLED = 'true';
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    if (originalHibpEnabled === undefined) {
      delete process.env.BETTER_AUTH_HIBP_ENABLED;
    } else {
      process.env.BETTER_AUTH_HIBP_ENABLED = originalHibpEnabled;
    }
    await closeAuthE2eApp({ app });
  });

  it('rejects sign-up with a known compromised password', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: uniqueTestEmail('hibp'),
        password: compromisedPassword,
        confirmPassword: compromisedPassword,
      });

    expect([400, 422]).toContain(response.status);
    expectEnvelopeFields(response.body);
    const message = (response.body as { message?: string }).message ?? '';
    expect(message.toLowerCase()).toContain('compromised');
  });
});
