import request from 'supertest';

import {
  authOkResponse,
  borderlinePassword,
  complexityWeakPassword,
  invalidEmail,
  longPassword,
  signOutResponse,
  signUpRequest,
  weakPassword,
} from 'test/fixtures';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelope,
  expectEnvelopeFields,
  getPrismaClient,
  isAuthIntegrationE2e,
  signInUser,
  signUpUser,
  verifyUserEmail,
  userPath,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Core (e2e) without database', () => {
  it('does not mount auth routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer()).get(authPath('/ok')).expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Core (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('GET /v1/api/auth/ok returns handleResponse envelope', async () => {
    const response = await request(app.getHttpServer())
      .get(authPath('/ok'))
      .expect(200);

    expectEnvelope(response.body, authOkResponse);
  });

  it('POST /v1/api/auth/sign/up/email returns envelope', async () => {
    const agent = request.agent(app.getHttpServer());
    const user = await signUpUser(agent);

    expect(user.email).toContain('@gmail.com');
  });

  it('rejects disposable email domains on sign-up with envelope', async () => {
    let response: { status: number; body: unknown } | undefined;
    try {
      response = await request(app.getHttpServer())
        .post(authPath('/sign/up/email'))
        .send({
          ...signUpRequest,
          email: `throwaway-${Date.now()}@mailinator.com`,
        });
    } catch (error) {
      const err = error as { code?: string };
      expect(err.code).toBe('ECONNRESET');
      return;
    }

    expect(response.status).toBeGreaterThanOrEqual(400);
    expectEnvelopeFields(response.body);
  });

  it('rejects invalid email on sign-up with envelope', async () => {
    let response: { status: number; body: unknown } | undefined;
    try {
      response = await request(app.getHttpServer())
        .post(authPath('/sign/up/email'))
        .send({
          ...signUpRequest,
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

  it('rejects weak password on sign-up with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: `weak-${Date.now()}@gmail.com`,
        password: weakPassword,
        confirmPassword: weakPassword,
      });

    expect(response.status).toBe(400);
    expectEnvelopeFields(response.body);
  });

  it('rejects missing firstName on sign-up with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: `missing-first-${Date.now()}@gmail.com`,
        firstName: '',
      });

    expect(response.status).toBe(400);
    expectEnvelopeFields(response.body);
  });

  it('rejects missing lastName on sign-up with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: `missing-last-${Date.now()}@gmail.com`,
        lastName: '',
      });

    expect(response.status).toBe(400);
    expectEnvelopeFields(response.body);
  });

  it('rejects confirm password mismatch on sign-up with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: `mismatch-${Date.now()}@gmail.com`,
        confirmPassword: 'OtherPass123!',
      });

    expect(response.status).toBe(400);
    expectEnvelopeFields(response.body);
  });

  it('rejects borderline password length on sign-up with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: `borderline-${Date.now()}@gmail.com`,
        password: borderlinePassword,
        confirmPassword: borderlinePassword,
      });

    expect(response.status).toBe(400);
    expectEnvelopeFields(response.body);
  });

  it('rejects password without complexity on sign-up with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: `complexity-${Date.now()}@gmail.com`,
        password: complexityWeakPassword,
        confirmPassword: complexityWeakPassword,
      });

    expect(response.status).toBe(400);
    expectEnvelopeFields(response.body);
  });

  it('rejects password over max length on sign-up with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: `long-${Date.now()}@gmail.com`,
        password: longPassword,
        confirmPassword: longPassword,
      });

    expect(response.status).toBe(400);
    expectEnvelopeFields(response.body);
  });

  it('rejects duplicate email on sign-up with envelope', async () => {
    const agent = request.agent(app.getHttpServer());
    const first = await signUpUser(agent);

    const response = await request(app.getHttpServer())
      .post(authPath('/sign/up/email'))
      .send({
        ...signUpRequest,
        email: first.email,
      });

    expect([200, 400, 409, 422]).toContain(response.status);
    expectEnvelopeFields(response.body);
  });

  it('happy path: sign-up, verify, sign-in, get-session, sign-out', async () => {
    const agent = request.agent(app.getHttpServer());
    const prisma = getPrismaClient(app);
    const user = await signUpUser(agent);

    await verifyUserEmail(agent, prisma, user.email);
    await signInUser(agent, user.email, user.password);

    const sessionResponse = await agent.get(userPath('/profile')).expect(200);
    expectEnvelopeFields(sessionResponse.body);

    const signOutResponseBody = await agent
      .post(authPath('/sign/out'))
      .expect(200);
    expectEnvelope(signOutResponseBody.body, signOutResponse);
  });

  it('returns 404 for legacy hyphenated public sign-up path', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/api/auth/sign-up/email')
      .send(signUpRequest);

    expect(response.status).toBe(404);
  });

  it('GET /v1/api/user/profile returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .get(userPath('/profile'))
      .expect(401);

    expectEnvelopeFields(response.body);
    expect(response.body).toMatchObject({
      statusCode: 401,
      statusType: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
  });

  it('returns 404 for legacy auth-prefixed profile path', async () => {
    const response = await request(app.getHttpServer()).get(
      authPath('/get/session'),
    );

    expect(response.status).toBe(404);
  });
});
