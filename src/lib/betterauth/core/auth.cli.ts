import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../../generated/prisma/client';

import { buildAuth } from './auth-options';

process.env.BETTER_AUTH_SECRET ??=
  'cli-generate-secret-minimum-32-characters-long';

function createCliPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim() ?? '';

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required to load Better Auth config for schema generation',
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const auth = buildAuth(createCliPrismaClient());
