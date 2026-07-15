import { runDashStartupChecks } from 'src/lib';

describe('runDashStartupChecks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    delete process.env.BETTER_AUTH_API_KEY;
    delete process.env.BETTER_AUTH_DASH_STARTUP_CHECKS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createPrismaMock(
    overrides: Partial<{
      userFindMany: jest.Mock;
      userCount: jest.Mock;
      sessionFindMany: jest.Mock;
    }> = {},
  ) {
    const userFindMany =
      overrides.userFindMany ?? jest.fn().mockResolvedValue([]);
    const userCount = overrides.userCount ?? jest.fn().mockResolvedValue(0);
    const sessionFindMany =
      overrides.sessionFindMany ?? jest.fn().mockResolvedValue([]);

    const prisma = {
      user: {
        findMany: userFindMany,
        count: userCount,
      },
      session: {
        findMany: sessionFindMany,
      },
    } as never;

    return { prisma, userFindMany, userCount, sessionFindMany };
  }

  it('skips checks when dashboard API key is not configured', async () => {
    const { prisma, userFindMany } = createPrismaMock();

    await runDashStartupChecks(prisma);

    expect(userFindMany).not.toHaveBeenCalled();
  });

  it('runs dash adapter-mirror queries when API key is configured', async () => {
    process.env.BETTER_AUTH_API_KEY = 'dash-api-key';
    const { prisma, userFindMany, userCount, sessionFindMany } =
      createPrismaMock();

    await runDashStartupChecks(prisma);

    expect(userFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(userCount).toHaveBeenCalledTimes(1);
    expect(sessionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { userId: true },
        take: 1,
      }),
    );
  });

  it('honors explicit dash startup check disable flag', async () => {
    process.env.BETTER_AUTH_API_KEY = 'dash-api-key';
    process.env.BETTER_AUTH_DASH_STARTUP_CHECKS = 'false';
    const { prisma, userFindMany } = createPrismaMock();

    await runDashStartupChecks(prisma);

    expect(userFindMany).not.toHaveBeenCalled();
  });

  it('fails with actionable error when required dash fields are missing', async () => {
    process.env.BETTER_AUTH_API_KEY = 'dash-api-key';
    const userFindMany = jest
      .fn()
      .mockRejectedValue(
        new Error(
          'Unknown argument `firstName`. Available options are marked with ?.',
        ),
      );
    const { prisma, userCount } = createPrismaMock({ userFindMany });

    await expect(runDashStartupChecks(prisma)).rejects.toThrow(
      'Better Auth dash compatibility check failed',
    );

    expect(userFindMany).toHaveBeenCalledTimes(1);
    expect(userCount).not.toHaveBeenCalled();
  });
});
