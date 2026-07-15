import request from 'supertest';

import { passkeySignInRequest } from 'test/fixtures';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  isAuthIntegrationE2e,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Passkey (e2e) without database', () => {
  it('does not mount passkey routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(authPath('/passkey/register'))
      .send({ name: 'Test Passkey' })
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Passkey (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('POST /v1/api/auth/passkey/register without session returns envelope error', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/passkey/register'))
      .send({ name: 'MacBook Pro Touch ID' });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toMatchObject({
      statusCode: 200,
      statusType: 'OK',
    });
  });

  it('POST /v1/api/auth/passkey/sign/in returns envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/passkey/sign/in'))
      .send(passkeySignInRequest);

    expectEnvelopeFields(response.body);
  });
});
