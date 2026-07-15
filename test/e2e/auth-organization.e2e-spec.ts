import request from 'supertest';

import {
  acceptInvitationResponse,
  createOrganizationRequest,
  createOrganizationResponse,
  inviteMemberRequest,
  inviteMemberResponse,
} from 'test/fixtures';

import {
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  getPrismaClient,
  isAuthIntegrationE2e,
  signInUser,
  signUpUser,
  uniqueTestEmail,
  verifyUserEmail,
  organisationPath,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Organization (e2e) without database', () => {
  it('does not mount organization routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .post(organisationPath('/create'))
      .send(createOrganizationRequest)
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Organization (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('POST /v1/api/organisation/create returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .post(organisationPath('/create'))
      .send(createOrganizationRequest)
      .expect(401);

    expectEnvelopeFields(response.body);
    expect(response.body).toMatchObject({
      statusCode: 401,
      statusType: 'UNAUTHORIZED',
    });
    expect(response.body).not.toEqual(createOrganizationResponse);
  });

  it.skip('creates organization and invites member when authenticated', async () => {
    const agent = request.agent(app.getHttpServer());
    const prisma = getPrismaClient(app);
    const user = await signUpUser(agent);
    await verifyUserEmail(agent, prisma, user.email);
    await signInUser(agent, user.email, user.password);

    const slug = `org-${Date.now()}`;
    const createResponse = await agent
      .post(organisationPath('/create'))
      .send({ name: 'Acme Billing', slug });

    expectEnvelopeFields(createResponse.body);

    const inviteResponse = await agent
      .post(organisationPath('/invite/member'))
      .send({
        ...inviteMemberRequest,
        email: uniqueTestEmail('member'),
      });

    expectEnvelopeFields(inviteResponse.body);
    expect(inviteResponse.body).not.toEqual(inviteMemberResponse);
  });

  it('POST /v1/api/organisation/accept/invitation returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .post(organisationPath('/accept/invitation'))
      .send({ invitationId: 'inv_invalid' })
      .expect(401);

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(acceptInvitationResponse);
  });

  it('GET /v1/api/organisation/list returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .get(organisationPath('/list'))
      .expect(401);

    expectEnvelopeFields(response.body);
    expect(response.body).toMatchObject({
      statusCode: 401,
      statusType: 'UNAUTHORIZED',
    });
  });
});
