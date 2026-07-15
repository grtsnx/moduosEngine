import { runAuthSchemaStartupChecks } from 'src/lib/betterauth/startup/auth-schema-startup-checks';

describe('runAuthSchemaStartupChecks', () => {
  it('runs a lightweight query for user schema columns including normalizedEmail', async () => {
    const queryRaw = jest.fn().mockResolvedValue([]);

    await runAuthSchemaStartupChecks({ $queryRaw: queryRaw } as never);

    expect(queryRaw).toHaveBeenCalledTimes(3);
  });

  it('fails with actionable error when name columns are missing in the database', async () => {
    const queryRaw = jest
      .fn()
      .mockRejectedValue(
        new Error('column "firstName" does not exist in relation "user"'),
      );

    await expect(
      runAuthSchemaStartupChecks({ $queryRaw: queryRaw } as never),
    ).rejects.toThrow('Better Auth schema check failed');
  });
});
