import 'dotenv/config';

import { randomBytes } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { generateId } from 'better-auth';
import { hashPassword } from 'better-auth/crypto';

import { PrismaClient } from '../generated/prisma/client';
import { readBackofficeSeedConfig } from '../src/lib/betterauth/core/auth-env';

function generateReferralCode(): string {
  return `ref_${randomBytes(8).toString('hex')}`;
}
function splitDisplayName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: 'Superadmin', lastName: 'User' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Admin' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

async function seedBackofficeAdmin(prisma: PrismaClient): Promise<void> {
  const config = readBackofficeSeedConfig();
  if (!config) {
    console.log(
      'Skipping backoffice admin seed: BACKOFFICE_ADMIN_EMAIL and BACKOFFICE_ADMIN_PASSWORD are required',
    );
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: config.email },
    include: { accounts: true },
  });

  const passwordHash = await hashPassword(config.password);
  const now = new Date();
  const { firstName, lastName } = splitDisplayName(config.name);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: config.name,
        firstName,
        lastName,
        role: 'admin',
        emailVerified: true,
        updatedAt: now,
      },
    });

    const credentialAccount = existing.accounts.find(
      (account) => account.providerId === 'credential',
    );

    if (credentialAccount) {
      await prisma.account.update({
        where: { id: credentialAccount.id },
        data: {
          password: passwordHash,
          updatedAt: now,
        },
      });
    } else {
      await prisma.account.create({
        data: {
          id: generateId(),
          userId: existing.id,
          providerId: 'credential',
          accountId: existing.id,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    console.log(`Updated backoffice admin: ${config.email}`);
    return;
  }

  const userId = generateId();
  await prisma.user.create({
    data: {
      id: userId,
      name: config.name,
      firstName,
      lastName,
      email: config.email,
      emailVerified: true,
      role: 'admin',
      referralCode: generateReferralCode(),
      createdAt: now,
      updatedAt: now,
      accounts: {
        create: {
          id: generateId(),
          providerId: 'credential',
          accountId: userId,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      },
    },
  });

  console.log(`Created backoffice admin: ${config.email}`);
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.log('Skipping seed: DATABASE_URL is not set');
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    await seedBackofficeAdmin(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
