import request from 'supertest';

import { signInEmailOtpResponse } from 'test/fixtures';

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

skipWithoutDb('Auth OTP sign-in (e2e) without database', () => {
  it('does not mount email OTP routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(authPath('/sign/in/email/otp'))
      .send({ email: uniqueTestEmail('otp'), otp: '123456' })
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth OTP sign-in (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('POST /v1/api/auth/email/otp/send can request sign-in OTP with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/email/otp/send'))
      .send({ email: uniqueTestEmail('sign-in-otp'), type: 'sign-in' });

    expectEnvelopeFields(response.body);
  });

  it('POST /v1/api/auth/sign/in/email/otp rejects invalid OTP with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/in/email/otp'))
      .send({ email: uniqueTestEmail('otp-sign-in'), otp: '000000' });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(signInEmailOtpResponse);
  });
});
