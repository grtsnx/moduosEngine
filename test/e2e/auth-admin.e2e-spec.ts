import request from 'supertest';

import { banUserResponse, listUsersResponse } from 'test/fixtures';

import {
  adminPath,
  authPath,
  banUserViaDb,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  getPrismaClient,
  isAuthIntegrationE2e,
  promoteToAdmin,
  signInUser,
  signUpUser,
  uniqueTestEmail,
  verifyUserEmail,
} from './auth/auth-e2e.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Admin (e2e) without database', () => {
  it('does not mount admin routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .get(adminPath('/list/users'))
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Admin (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('GET /v1/api/admin/list/users requires admin session with envelope', async () => {
    const response = await request(app.getHttpServer()).get(
      adminPath('/list/users'),
    );

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(listUsersResponse);
  });

  it('POST /v1/api/admin/ban/user requires admin session with envelope', async () => {
    const response = await request(app.getHttpServer())
      .post(adminPath('/ban/user'))
      .send({
        userId: 'usr_01HXYZ000000000000000000',
        banReason: 'Terms of service violation',
      });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toEqual(banUserResponse);
  });

  it.skip('admin can list users after promotion', async () => {
    const agent = request.agent(app.getHttpServer());
    const prisma = getPrismaClient(app);
    const adminUser = await signUpUser(agent, {
      email: uniqueTestEmail('admin'),
    });
    await verifyUserEmail(agent, prisma, adminUser.email);
    await promoteToAdmin(prisma, adminUser.email);
    await signInUser(agent, adminUser.email, adminUser.password);

    const response = await agent.get(adminPath('/list/users'));

    expectEnvelopeFields(response.body);
    expect(response.body).toMatchObject({
      statusCode: 200,
      statusType: 'OK',
    });
  });

  it.skip('banned user sign-in is blocked with envelope', async () => {
    const prisma = getPrismaClient(app);
    const agent = request.agent(app.getHttpServer());
    const user = await signUpUser(agent);
    await verifyUserEmail(agent, prisma, user.email);

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
    expect(dbUser).toBeTruthy();
    await banUserViaDb(prisma, dbUser!.id);

    const response = await request(app.getHttpServer())
      .post(authPath('/sign/in/email'))
      .send({ email: user.email, password: user.password });

    expectEnvelopeFields(response.body);
    expect(response.body).not.toMatchObject({
      statusCode: 200,
      statusType: 'OK',
    });
  });
});
