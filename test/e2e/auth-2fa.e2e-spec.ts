import request from 'supertest';

import {
  disable2faResponse,
  enable2faResponse,
  validPassword,
  verify2faResponse,
} from 'test/fixtures';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  isAuthIntegrationE2e,
  userPath,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth 2FA (e2e) without database', () => {
  it('does not mount 2FA routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(userPath('/two/factor/enable'))
      .send({ password: validPassword })
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth 2FA (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('POST /v1/api/user/two/factor/enable requires session with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(userPath('/two/factor/enable'))
      .send({ password: validPassword });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(enable2faResponse);
  });

  it('POST /v1/api/auth/two/factor/verify requires challenge with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/two/factor/verify'))
      .send({ code: '123456' });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(verify2faResponse);
  });

  it('POST /v1/api/user/two/factor/disable requires session with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(userPath('/two/factor/disable'))
      .send({ code: '123456' });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(disable2faResponse);
  });
});
