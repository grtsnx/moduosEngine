export { LibModule } from './lib.module';
export { SendMailsModule } from './email/sendMail.module';
export { SendMailsService } from './email/sendMail.service';
export { PrismaModule } from './prisma/prisma.module';
export { PrismaService } from './prisma/prisma.service';
export { RedisModule } from './redis/redis.module';
export { RedisService } from './redis/redis.service';
export { GravatarModule } from './gravatar/gravatar.module';
export { GravatarService, ensureHttpsUrl } from './gravatar/gravatar.service';
export { BetterAuthModule } from './betterauth/core/betterauth.module';
export { setAuthMailService } from './betterauth/core/auth-email';
export { runDashStartupChecks } from './betterauth/startup/dash-startup-checks';
export { runAuthSchemaStartupChecks } from './betterauth/startup/auth-schema-startup-checks';
export {
  API_V1_PREFIX,
  AUTH_BASE_PATH,
  USER_BASE_PATH,
  ORGANISATION_BASE_PATH,
  TEAMS_BASE_PATH,
  ADMIN_BASE_PATH,
  API_ROUTE_REWRITES,
  AUTH_ROUTE_REWRITES,
  authPath,
  userPath,
  organisationPath,
  teamsPath,
  adminPath,
  buildAuthPathRewriteMap,
  internalAuthPath,
  isPublicAuthSuffix,
  isProxiedBetterAuthPath,
  toBetterAuthRelativePath,
} from './betterauth/paths/auth-paths';
export {
  AUTH_API_CATALOG,
  AUTH_E2E_COVERED_PUBLIC_SUFFIXES,
  USER_E2E_COVERED_PUBLIC_SUFFIXES,
  ORGANISATION_E2E_COVERED_PUBLIC_SUFFIXES,
  TEAMS_E2E_COVERED_PUBLIC_SUFFIXES,
  ADMIN_E2E_COVERED_PUBLIC_SUFFIXES,
  buildApiRouteRewrites,
  buildAuthRouteRewrites,
  catalogEntryNeedsRewrite,
  catalogPublicPath,
  toPublicSuffix,
} from './betterauth/catalog/auth-api-catalog';
export {
  STRONG_PASSWORD_MAX_LENGTH,
  STRONG_PASSWORD_MIN_LENGTH,
  STRONG_PASSWORD_PATTERN,
} from './betterauth/hooks/sign-up-validation';
