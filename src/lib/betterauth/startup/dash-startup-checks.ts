import { Logger } from '@nestjs/common';
import type { PrismaClient } from 'generated/prisma/client';

import { shouldRunDashStartupChecks } from '../core/auth-env';

const dashStartupLogger = new Logger('BetterAuthDashStartupChecks');

export async function runDashStartupChecks(
  prisma: PrismaClient,
): Promise<void> {
  if (!shouldRunDashStartupChecks()) {
    return;
  }

  try {
    await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    await prisma.user.count();

    const activityWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.session.findMany({
      where: {
        updatedAt: { gte: activityWindowStart },
      },
      select: { userId: true },
      take: 1,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    dashStartupLogger.error(
      `Better Auth dash startup compatibility check failed: ${details}`,
    );
    dashStartupLogger.error(
      'Ensure Better Auth migrations are applied and required dash query fields exist before serving /dash/* routes.',
    );
    throw new Error(`Better Auth dash compatibility check failed: ${details}`);
  }

  dashStartupLogger.log(
    'Better Auth dash startup compatibility checks passed for user/session query paths.',
  );
}
