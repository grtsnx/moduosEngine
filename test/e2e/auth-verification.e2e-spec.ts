import request from 'supertest';

import { sendVerificationResponse, verifyEmailResponse } from 'test/fixtures';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelope,
  expectEnvelopeFields,
  isAuthIntegrationE2e,
  signUpUser,
  uniqueTestEmail,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Verification (e2e) without database', () => {
  it('does not mount verification routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(authPath('/email/otp/send'))
      .send({ email: uniqueTestEmail('verify'), type: 'email-verification' })
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Verification (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('POST /v1/api/auth/email/otp/send returns envelope', async () => {
    const email = uniqueTestEmail('verify-send');
    const agent = request.agent(app.getHttpServer());
    await signUpUser(agent, { email });

    const response = await agent
      .post(authPath('/email/otp/send'))
      .send({ email, type: 'email-verification' })
      .expect(200);

    expectEnvelope(response.body, sendVerificationResponse);
  });

  it('POST /v1/api/auth/email/otp/verify rejects invalid OTP with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/email/otp/verify'))
      .send({ email: uniqueTestEmail('verify-invalid'), otp: '000000' });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(verifyEmailResponse);
  });
});
