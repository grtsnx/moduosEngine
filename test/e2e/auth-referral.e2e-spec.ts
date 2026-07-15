import request from 'supertest';

import {
  asEnvelope,
  closeAuthE2eApp,
  createAuthE2eApp,
  expectEnvelopeFields,
  getPrismaClient,
  isAuthIntegrationE2e,
  signInUser,
  signUpUser,
  verifyUserEmail,
  uniqueTestEmail,
} from './auth/auth-e2e.helper';
import { authPath, userPath } from 'src/lib/betterauth/paths/auth-paths';
import { validPassword } from 'test/fixtures';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Referral (e2e) without database', () => {
  it('returns envelope for unauthenticated referral me', async () => {
    const { app } = await createAuthE2eApp();

    const response = await request(app.getHttpServer()).get(
      '/v1/api/referral/me',
    );

    expect([401, 404]).toContain(response.status);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Referral (e2e) integration', () => {
  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];

  beforeEach(async () => {
    ({ app } = await createAuthE2eApp());
  });

  afterEach(async () => {
    await closeAuthE2eApp({ app });
  });

  it('assigns referral codes and attributes new sign-ups', async () => {
    const referrerAgent = request.agent(app.getHttpServer());
    const prisma = getPrismaClient(app);
    const referrer = await signUpUser(referrerAgent);
    await verifyUserEmail(referrerAgent, prisma, referrer.email);
    await signInUser(referrerAgent, referrer.email, referrer.password);

    const me = await referrerAgent.get('/v1/api/referral/me').expect(200);
    expectEnvelopeFields(me.body);
    const meData = asEnvelope(me.body).data as {
      referralCode: string;
      referredCount: number;
    };
    expect(meData.referralCode).toMatch(/^ref_/);
    expect(meData.referredCount).toBe(0);

    const code = meData.referralCode;
    const validate = await request(app.getHttpServer())
      .get(`/v1/api/referral/validate/${code}`)
      .expect(200);
    expect(asEnvelope(validate.body).data).toEqual({ valid: true });

    const referredAgent = request.agent(app.getHttpServer());
    const referredEmail = uniqueTestEmail('referred');
    await referredAgent
      .post(authPath('/sign/up/email'))
      .send({
        email: referredEmail,
        password: validPassword,
        confirmPassword: validPassword,
        firstName: 'Referred',
        lastName: 'User',
        referralCode: code,
      })
      .expect(200);

    const referredUser = await prisma.user.findUnique({
      where: { email: referredEmail },
      select: { referredByUserId: true, referralCode: true },
    });
    expect(referredUser?.referralCode).toMatch(/^ref_/);
    expect(referredUser?.referredByUserId).toBeTruthy();

    const list = await referrerAgent.get('/v1/api/referral/list').expect(200);
    const listData = asEnvelope(list.body).data as {
      referrals: unknown[];
    };
    expect(listData.referrals.length).toBeGreaterThanOrEqual(1);

    const profile = await referrerAgent.get(userPath('/profile')).expect(200);
    const profileData = asEnvelope(profile.body).data as {
      user: { referralCode: string };
    };
    expect(profileData.user.referralCode).toBe(code);
  });

  it('GET /v1/api/referral/me returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/api/referral/me')
      .expect(401);
    expectEnvelopeFields(response.body);
  });
});
