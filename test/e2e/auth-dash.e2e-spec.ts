import request from 'supertest';

import {
  authPath,
  closeAuthE2eApp,
  createAuthE2eApp,
  isAuthIntegrationE2e,
} from './auth/auth-e2e.helper';
import {
  createDashInfraMockServer,
  type DashInfraMockServer,
} from './auth/auth-dash-infra.helper';

const skipWithoutDb = isAuthIntegrationE2e() ? describe.skip : describe;
const integrationOnly = isAuthIntegrationE2e() ? describe : describe.skip;

skipWithoutDb('Auth Dash (e2e) without database', () => {
  it('does not mount dash routes when DATABASE_URL is unset', async () => {
    const { app } = await createAuthE2eApp();

    await request(app.getHttpServer())
      .get(authPath('/dash/config'))
      .expect(404);

    await closeAuthE2eApp({ app });
  });
});

integrationOnly('Auth Dash (e2e) integration', () => {
  const dashApiKey = 'dash-api-key-test';

  let app: Awaited<ReturnType<typeof createAuthE2eApp>>['app'];
  let dashInfra: DashInfraMockServer;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    originalEnv = { ...process.env };
    dashInfra = await createDashInfraMockServer(dashApiKey);

    process.env.BETTER_AUTH_API_KEY = dashApiKey;
    process.env.BETTER_AUTH_API_URL = dashInfra.apiUrl;
    process.env.BETTER_AUTH_DASH_STARTUP_CHECKS = 'true';

    ({ app } = await createAuthE2eApp());
  });

  afterAll(async () => {
    await closeAuthE2eApp({ app });
    await dashInfra.close();
    process.env = originalEnv;
  });

  async function authHeader(): Promise<Record<string, string>> {
    const token = await dashInfra.issueDashToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  it('GET /v1/api/auth/dash/config returns 200 with native dash payload', async () => {
    const response = await request(app.getHttpServer())
      .get(authPath('/dash/config'))
      .set(await authHeader())
      .expect(200);

    const body = response.body as Record<string, unknown>;
    const user = body.user as Record<string, unknown>;

    expect(body.basePath).toBe('/v1/api/auth');
    expect(user.modelName).toBe('user');
    expect(body).not.toHaveProperty('statusCode');
  });

  it('GET /v1/api/auth/dash/list-users returns 200 with expected keys', async () => {
    const response = await request(app.getHttpServer())
      .get(authPath('/dash/list-users'))
      .set(await authHeader())
      .expect(200);

    const body = response.body as Record<string, unknown>;

    expect(Array.isArray(body.users)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(typeof body.offset).toBe('number');
    expect(typeof body.limit).toBe('number');
    expect(body).not.toHaveProperty('statusCode');
  });

  it('GET /v1/api/auth/dash/user-stats returns 200 and never 500', async () => {
    const response = await request(app.getHttpServer())
      .get(authPath('/dash/user-stats'))
      .set(await authHeader())
      .expect(200);

    const body = response.body as Record<string, unknown>;
    const activeUsers = body.activeUsers as Record<string, unknown>;

    expect(typeof body.daily).toBe('object');
    expect(typeof body.weekly).toBe('object');
    expect(typeof body.monthly).toBe('object');
    expect(body.total).toBeDefined();
    expect(typeof activeUsers.daily).toBe('object');
    expect(typeof activeUsers.weekly).toBe('object');
    expect(typeof activeUsers.monthly).toBe('object');
    expect(body).not.toHaveProperty('statusCode');
  });

  it('GET /v1/api/auth/dash/user-graph-data returns 200 with data array', async () => {
    const response = await request(app.getHttpServer())
      .get(authPath('/dash/user-graph-data'))
      .query({ period: 'daily' })
      .set(await authHeader())
      .expect(200);

    const body = response.body as Record<string, unknown>;

    expect(body.period).toBe('daily');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).not.toHaveProperty('statusCode');
  });

  it('returns 401 for dash route without JWT', async () => {
    await request(app.getHttpServer())
      .get(authPath('/dash/user-stats'))
      .expect(401);
  });

  it('returns 401 for dash route with invalid JWT', async () => {
    await request(app.getHttpServer())
      .get(authPath('/dash/user-stats'))
      .set('Authorization', 'Bearer invalid-dash-token')
      .expect(401);
  });
});
