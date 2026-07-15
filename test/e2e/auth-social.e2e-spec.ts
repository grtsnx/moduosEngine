import request from 'supertest';

import {
  maliciousCallbackUrl,
  malformedCallbackUrl,
  oauthStateMock,
} from 'test/fixtures';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  isAuthIntegrationE2e,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Social (e2e) without database', () => {
  it('does not mount social routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(authPath('/sign/in/social'))
      .send(oauthStateMock)
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Social (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('POST /v1/api/auth/sign/in/social without OAuth env returns error envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/in/social'))
      .send(oauthStateMock);

    expectEnvelopeFields(response.body);
    expect(response.body).not.toMatchObject({
      statusCode: 200,
      statusType: 'OK',
    });
  });

  it('rejects untrusted callback URL before social flow is started', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/in/social'))
      .send({
        ...oauthStateMock,
        callbackURL: maliciousCallbackUrl,
      });

    expect(response.status).toBe(403);
    expectEnvelopeFields(response.body);
  });

  it('rejects malformed callback URL before social flow is started', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/in/social'))
      .send({
        ...oauthStateMock,
        callbackURL: malformedCallbackUrl,
      });

    expect(response.status).toBe(400);
    expectEnvelopeFields(response.body);
  });
});
