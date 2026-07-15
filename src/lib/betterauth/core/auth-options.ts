import type { BetterAuthPlugin } from '@better-auth/core';
import { dash, sentinel } from '@better-auth/infra';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  createAuthMiddleware,
  APIError,
  getSessionFromCtx,
} from 'better-auth/api';
import { emailHarmony } from 'better-auth-harmony';
import { HttpStatus } from '@nestjs/common';
import { admin } from 'better-auth/plugins/admin';
import { bearer } from 'better-auth/plugins/bearer';
import {
  captcha,
  emailOTP,
  haveIBeenPwned,
  lastLoginMethod,
} from 'better-auth/plugins';
import { organization } from 'better-auth/plugins/organization';
import { twoFactor } from 'better-auth/plugins/two-factor';
import type { PrismaClient } from 'generated/prisma/client';
import type Redis from 'ioredis';

import {
  buildHandleResponseBody,
  isHandleResponseBody,
} from '../../../middleware/common/handle-response-body';

import {
  runAuthBeforeRequest,
  wrapAuthBeforeError,
} from '../hooks/auth-before-hook';
import { applySignupProfileImage } from '../hooks/auth-gravatar';
import {
  generateReferralCode,
  normalizeReferralCodeInput,
} from '../hooks/referral-code';
import { isCatalogAuthRequiredPath } from '../hooks/session-route-guard';
import { AUTH_BASE_PATH } from '../paths/auth-paths';
import { shouldSkipEnvelope } from '../response/redirect-paths';
import {
  isMissingAuthSession,
  wrapAuthData,
  wrapAuthError,
  wrapMissingAuthSessionError,
  resolveAuthMessage,
} from '../response/response-envelope';
import { shouldTreatMessageOnlyReturnAsError } from '../response/response-messages';
import { createAuthEmailHandlers, toWelcomeEmailUser } from './auth-email';
import {
  buildAdvancedAuthOptions,
  buildBetterAuthRateLimit,
  buildSocialProviders,
  buildTrustedOrigins,
  CAPTCHA_PROTECTED_ENDPOINTS,
  isBetterAuthRateLimitEnabled,
  readBetterAuthApiUrl,
  readBetterAuthIdentifyUrl,
  readTurnstileSecretKey,
  shouldEnableCaptcha,
  shouldEnableHibp,
  shouldEnableInfraEmailValidation,
  shouldRequireEmailVerification,
  resolveAuthAppName,
  resolveBetterAuthSecret,
  resolveBetterAuthUrl,
} from './auth-env';
import { buildBetterAuthLogger } from './auth-logger';
import { createRedisSecondaryStorage } from './redis-secondary-storage';
import {
  handleExistingUserSignUp,
  registerAuthForExistingUserSignUp,
} from './existing-user-signup';

type AuthRequestContext = {
  pendingReferredByUserId?: string;
};

async function resolveUniqueReferralCode(
  prisma: PrismaClient,
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const referralCode = generateReferralCode();
    const existing = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (!existing) {
      return referralCode;
    }
  }

  throw new APIError('INTERNAL_SERVER_ERROR', {
    message: 'Unable to allocate referral code',
  });
}

export interface BuildAuthOptions {
  redis?: Redis | null;
  /** Extra plugins appended after base plugins (e.g. testUtils in test-only auth). */
  extraPlugins?: BetterAuthPlugin[];
}

export function buildAuth(
  prisma: PrismaClient,
  options: BuildAuthOptions = {},
) {
  const emailHandlers = createAuthEmailHandlers();
  const socialProviders = buildSocialProviders();
  const trustedOrigins = buildTrustedOrigins();
  const betterAuthRateLimit = buildBetterAuthRateLimit();
  const isRateLimitEnabled = isBetterAuthRateLimitEnabled();
  const requireEmailVerification = shouldRequireEmailVerification();
  const infraApiKey = process.env.BETTER_AUTH_API_KEY?.trim();
  const infraApiUrl = readBetterAuthApiUrl();
  const infraIdentifyUrl = readBetterAuthIdentifyUrl();

  const secondaryStorage =
    options.redis != null
      ? createRedisSecondaryStorage(options.redis)
      : undefined;

  const basePlugins = [
    emailHarmony({
      allowNormalizedSignin: false,
    }),
    twoFactor({
      issuer: resolveAuthAppName(),
      totpOptions: {
        digits: 6,
        period: 30,
      },
      otpOptions: {
        period: 5,
        digits: 6,
        allowedAttempts: 5,
        storeOTP: 'hashed',
        async sendOTP({ user, otp }) {
          await emailHandlers.sendTwoFactorOTP({ user, otp });
        },
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: 'encrypted',
      },
      twoFactorCookieMaxAge: 600,
      trustDeviceMaxAge: 30 * 24 * 60 * 60,
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 15 * 60,
      },
    }),
    organization({
      allowUserToCreateOrganization: (user) => user.emailVerified === true,
      organizationLimit: 5,
      membershipLimit: 100,
      invitationLimit: 50,
      invitationExpiresIn: 2 * 24 * 60 * 60,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,
      disableOrganizationDeletion: true,
      creatorRole: 'owner',
      teams: {
        enabled: true,
        maximumTeams: 20,
        maximumMembersPerTeam: 50,
        allowRemovingAllTeams: false,
      },
      async sendInvitationEmail(data) {
        await emailHandlers.sendOrgInvitation(data);
      },
    }),
    admin(),
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: 'hashed',
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'change-email') {
          await emailHandlers.sendVerificationOTP({
            email,
            otp,
            type: 'email-verification',
          });
          return;
        }

        await emailHandlers.sendVerificationOTP({ email, otp, type });
      },
    }),
    passkey(),
    haveIBeenPwned({
      enabled: shouldEnableHibp(),
      customPasswordCompromisedMessage:
        'The password you entered has been compromised. Please choose a different password.',
    }),
    lastLoginMethod({
      storeInDatabase: true,
    }),
  ];

  const captchaPlugins = shouldEnableCaptcha()
    ? [
        captcha({
          provider: 'cloudflare-turnstile',
          secretKey: readTurnstileSecretKey(),
          endpoints: [...CAPTCHA_PROTECTED_ENDPOINTS],
        }),
      ]
    : [];

  const infraPluginOptions = {
    apiKey: infraApiKey ?? '',
    ...(infraApiUrl ? { apiUrl: infraApiUrl } : {}),
    ...(infraIdentifyUrl ? { kvUrl: infraIdentifyUrl } : {}),
  };

  const infraPlugins = infraApiKey
    ? [
        dash({
          ...infraPluginOptions,
        }),
        sentinel({
          ...infraPluginOptions,
          ...(infraIdentifyUrl ? { identifyUrl: infraIdentifyUrl } : {}),
          security: {
            emailValidation: { enabled: shouldEnableInfraEmailValidation() },
          },
        }),
      ]
    : [];

  const auth = betterAuth({
    appName: resolveAuthAppName(),
    baseURL: resolveBetterAuthUrl(),
    basePath: AUTH_BASE_PATH,
    secret: resolveBetterAuthSecret(),
    logger: buildBetterAuthLogger(),
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    experimental: { joins: true },
    trustedOrigins,
    user: {
      modelName: 'user',
      additionalFields: {
        firstName: { type: 'string', required: true, input: true },
        lastName: { type: 'string', required: true, input: true },
        referralCode: {
          type: 'string',
          required: true,
          input: false,
          returned: true,
        },
        referredByUserId: {
          type: 'string',
          required: false,
          input: false,
          returned: false,
        },
      },
    },
    account: {
      modelName: 'account',
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 256,
      resetPasswordTokenExpiresIn: 30 * 60,
      revokeSessionsOnPasswordReset: true,
      customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
        ...coreFields,
        role: 'user',
        banned: false,
        banReason: null,
        banExpires: null,
        twoFactorEnabled: false,
        lastLoginMethod: null,
        referralCode: generateReferralCode(),
        referredByUserId: null,
        ...additionalFields,
        id,
      }),
      onExistingUserSignUp: async ({ user }) => {
        await handleExistingUserSignUp(user);
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
    },
    ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
    session: {
      modelName: 'session',
      storeSessionInDatabase: true,
    },
    ...(secondaryStorage
      ? {
          secondaryStorage,
          rateLimit: {
            enabled: isRateLimitEnabled,
            storage: 'secondary-storage' as const,
            window: betterAuthRateLimit.window,
            max: betterAuthRateLimit.max,
          },
        }
      : {
          rateLimit: {
            enabled: isRateLimitEnabled,
            storage: 'database' as const,
            window: betterAuthRateLimit.window,
            max: betterAuthRateLimit.max,
          },
        }),
    advanced: buildAdvancedAuthOptions(),
    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            const authContext = ctx?.context as AuthRequestContext | undefined;
            const pendingReferredByUserId =
              authContext?.pendingReferredByUserId;
            const referralCode =
              typeof user.referralCode === 'string' &&
              user.referralCode.length > 0
                ? user.referralCode
                : await resolveUniqueReferralCode(prisma);

            return {
              data: {
                ...applySignupProfileImage(user),
                referralCode,
                ...(pendingReferredByUserId
                  ? { referredByUserId: pendingReferredByUserId }
                  : {}),
              },
            };
          },
          after: async (user) => {
            if (!user.emailVerified) {
              return;
            }

            await emailHandlers.sendWelcome({
              user: toWelcomeEmailUser(user),
            });
          },
        },
        update: {
          before: async (data, ctx) => {
            await Promise.resolve();
            if (data.emailVerified === true && ctx?.context) {
              ctx.context.sendWelcomeAfterVerify = true;
            }
            return { data };
          },
          after: async (user, ctx) => {
            if (!ctx?.context?.sendWelcomeAfterVerify || !user.emailVerified) {
              return;
            }

            delete ctx.context.sendWelcomeAfterVerify;
            await emailHandlers.sendWelcome({
              user: toWelcomeEmailUser(user),
            });
          },
        },
      },
    },
    plugins: [
      ...basePlugins,
      ...captchaPlugins,
      ...infraPlugins,
      ...(options.extraPlugins ?? []),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        try {
          runAuthBeforeRequest(ctx.path, ctx.body, trustedOrigins);
        } catch (error) {
          const body = wrapAuthBeforeError(error);
          if (body) {
            return ctx.json(body, { status: body.statusCode });
          }
          throw error;
        }

        const bodyRecord =
          typeof ctx.body === 'object' && ctx.body !== null
            ? (ctx.body as Record<string, unknown>)
            : null;
        const referralCodeInput = normalizeReferralCodeInput(
          bodyRecord?.referralCode,
        );

        if (ctx.path === '/sign-up/email' && referralCodeInput && bodyRecord) {
          const referrer = await prisma.user.findUnique({
            where: { referralCode: referralCodeInput },
            select: { id: true },
          });

          if (!referrer) {
            const body = wrapAuthError(
              new APIError('BAD_REQUEST', {
                message: 'Invalid referral code',
              }),
            );
            return ctx.json(body, { status: body.statusCode });
          }

          const authContext = ctx.context as AuthRequestContext;
          authContext.pendingReferredByUserId = referrer.id;
          delete bodyRecord.referralCode;
        }

        if (isCatalogAuthRequiredPath(ctx.path)) {
          const session = await getSessionFromCtx(ctx);
          if (!session) {
            const body = wrapMissingAuthSessionError();
            return ctx.json(body, { status: body.statusCode });
          }
        }

        return;
      }),
      after: createAuthMiddleware(async (ctx) => {
        await Promise.resolve();
        if (shouldSkipEnvelope(ctx.path)) {
          return;
        }

        const returned = ctx.context.returned;

        if (isHandleResponseBody(returned)) {
          return ctx.json(returned, { status: returned.statusCode });
        }

        if (returned instanceof APIError) {
          const body = wrapAuthError(returned);
          return ctx.json(body, { status: body.statusCode });
        }

        if (isMissingAuthSession(ctx.path, returned)) {
          const body = wrapMissingAuthSessionError();
          return ctx.json(body, { status: body.statusCode });
        }

        if (
          shouldTreatMessageOnlyReturnAsError(ctx.path) &&
          typeof returned === 'object' &&
          returned !== null &&
          typeof (returned as { message?: unknown }).message === 'string'
        ) {
          const message = (returned as { message: string }).message;
          const body = buildHandleResponseBody(HttpStatus.BAD_REQUEST, message);
          return ctx.json(body, { status: body.statusCode });
        }

        const { statusCode, message } = resolveAuthMessage(ctx.path);

        return ctx.json(
          buildHandleResponseBody(
            statusCode,
            message,
            wrapAuthData(ctx.path, returned),
          ),
        );
      }),
    },
  });

  registerAuthForExistingUserSignUp(auth);

  return auth;
}

export type Auth = ReturnType<typeof buildAuth>;
export type Session = Auth['$Infer']['Session'];
