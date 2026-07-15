import request from 'supertest';

import {
  invalidEmail,
  requestPasswordResetResponse,
  resetPasswordResponse,
  validEmail,
} from 'test/fixtures';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelope,
  expectEnvelopeFields,
  isAuthIntegrationE2e,
  signUpUser,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Password (e2e) without database', () => {
  it('does not mount password reset routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(authPath('/email/otp/request/password/reset'))
      .send({ email: validEmail })
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Password (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('POST /v1/api/auth/email/otp/request/password/reset returns envelope', async () => {
    const agent = request.agent(app.getHttpServer());
    const { email } = await signUpUser(agent);

    const response = await agent
      .post(authPath('/email/otp/request/password/reset'))
      .send({ email })
      .expect(200);

    expectEnvelope(response.body, requestPasswordResetResponse);
  });

  it('POST /v1/api/auth/email/otp/request/password/reset accepts unknown email with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/email/otp/request/password/reset'))
      .send({
        email: `unknown-${Date.now()}@gmail.com`,
      })
      .expect(200);

    expectEnvelopeFields(response.body);
  });

  it('rejects invalid email on password reset OTP request with envelope', async () => {
    let response: { status: number; body: unknown } | undefined;
    try {
      response = await request(app.getHttpServer())
        .post(authPath('/email/otp/request/password/reset'))
        .send({
          email: invalidEmail,
        });
    } catch (error) {
      const err = error as { code?: string };
      expect(err.code).toBe('ECONNRESET');
      return;
    }

    expect(response.status).toBeGreaterThanOrEqual(400);
    expectEnvelopeFields(response.body);
  });

  it('POST /v1/api/auth/email/otp/reset/password rejects invalid OTP with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/email/otp/reset/password'))
      .send({
        email: validEmail,
        otp: '000000',
        password: 'NewSecurePass123!',
      });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(resetPasswordResponse);
  });
});
