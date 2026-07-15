import request from 'supertest';

import {
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  getPrismaClient,
  isAuthIntegrationE2e,
  signInUser,
  signUpUser,
  teamsPath,
  verifyUserEmail,
  organisationPath,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Teams (e2e) without database', () => {
  it('does not mount teams routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(teamsPath('/create'))
      .send({ name: 'Engineering' })
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Teams (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('POST /v1/api/teams/create returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .post(teamsPath('/create'))
      .send({ name: 'Engineering' })
      .expect(401);

    expectEnvelopeFields(response.body);
    expect(response.body).toMatchObject({
      statusCode: 401,
      statusType: 'UNAUTHORIZED',
    });
  });

  it('POST /v1/api/teams/list returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .get(teamsPath('/list'))
      .expect(401);

    expectEnvelopeFields(response.body);
  });

  it('creates a team under an organization when authenticated', async () => {
    const agent = request.agent(app.getHttpServer());
    const prisma = getPrismaClient(app);
    const user = await signUpUser(agent);
    await verifyUserEmail(agent, prisma, user.email);
    await signInUser(agent, user.email, user.password);

    const slug = `org-team-${Date.now()}`;
    const createOrg = await agent
      .post(organisationPath('/create'))
      .send({ name: 'Team Org', slug });

    expectEnvelopeFields(createOrg.body);

    const createTeam = await agent
      .post(teamsPath('/create'))
      .send({ name: 'Engineering' });

    expectEnvelopeFields(createTeam.body);
    expect(createTeam.status).toBeLessThan(400);
  });
});
