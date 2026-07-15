import { Logger } from '@nestjs/common';
import type { PrismaClient } from 'generated/prisma/client';

const authSchemaLogger = new Logger('BetterAuthSchemaStartupChecks');

export async function runAuthSchemaStartupChecks(
  prisma: PrismaClient,
): Promise<void> {
  try {
    await prisma.$queryRaw`
      SELECT "firstName", "lastName", "lastLoginMethod", "normalizedEmail", "referralCode", "referredByUserId"
      FROM "user"
      LIMIT 0
    `;
    await prisma.$queryRaw`
      SELECT "id", "name", "organizationId", "createdAt", "updatedAt"
      FROM "team"
      LIMIT 0
    `;
    await prisma.$queryRaw`
      SELECT "id", "teamId", "userId", "createdAt"
      FROM "teamMember"
      LIMIT 0
    `;
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    authSchemaLogger.error(
      `Better Auth schema startup check failed: ${details}`,
    );
    authSchemaLogger.error(
      'Apply pending migrations with `bun run prisma:migrate:deploy`, then run `bun run prisma:generate` and restart the server.',
    );
    throw new Error(`Better Auth schema check failed: ${details}`);
  }

  authSchemaLogger.log(
    'Better Auth schema startup checks passed for user profile, referral, and team tables.',
  );
}
