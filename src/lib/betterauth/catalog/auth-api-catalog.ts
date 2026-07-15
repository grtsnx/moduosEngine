import type { AuthApiResponseSampleId } from './auth-api-catalog-samples';

export type AuthApiTag =
  'Server' | 'Auth' | 'User' | 'Organisation' | 'Teams' | 'Backoffice';
export type AuthApiSecurity = 'public' | 'session' | 'admin';
export type AuthHttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
export type ApiRouteGroup =
  'auth' | 'user' | 'organisation' | 'teams' | 'admin';

const API_V1_PREFIX = '/v1/api';

export const ROUTE_GROUP_BASE: Record<ApiRouteGroup, string> = {
  auth: `${API_V1_PREFIX}/auth`,
  user: `${API_V1_PREFIX}/user`,
  organisation: `${API_V1_PREFIX}/organisation`,
  teams: `${API_V1_PREFIX}/teams`,
  admin: `${API_V1_PREFIX}/admin`,
};

export interface AuthApiCatalogEntry {
  internalPath: string;
  publicSuffix: string;
  legacyAuthPublicSuffix: string;
  routeGroup: ApiRouteGroup;
  method: AuthHttpMethod;
  summary: string;
  tag: AuthApiTag;
  security: AuthApiSecurity;
  requestExample?: Record<string, unknown>;
  responseSampleId: AuthApiResponseSampleId;
}

const PUBLIC_SUFFIX_OVERRIDES: Record<string, string> = {
  '/passkey/generate-register-options': '/passkey/register',
  '/passkey/verify-authentication': '/passkey/sign/in',
  '/passkey/verify-registration': '/passkey/verify/registration',
  '/passkey/list-user-passkeys': '/passkey/list',
  '/passkey/update-passkey': '/passkey/update',
  '/passkey/delete-passkey': '/passkey/delete',
  '/two-factor/verify-totp': '/two/factor/verify',
  '/email-otp/send-verification-otp': '/email/otp/send',
  '/email-otp/check-verification-otp': '/email/otp/check',
  '/email-otp/verify-email': '/email/otp/verify',
  '/sign-in/email-otp': '/sign/in/email/otp',
  '/email-otp/request-password-reset': '/email/otp/request/password/reset',
  '/email-otp/reset-password': '/email/otp/reset/password',
};

export function toPublicSuffix(internalPath: string): string {
  const override = PUBLIC_SUFFIX_OVERRIDES[internalPath];
  if (override) {
    return override;
  }

  const segments = internalPath.split('/').filter(Boolean);
  return `/${segments.map((segment) => segment.replace(/-/g, '/')).join('/')}`;
}

function routeGroupFromTag(tag: AuthApiTag): ApiRouteGroup {
  switch (tag) {
    case 'User':
      return 'user';
    case 'Organisation':
      return 'organisation';
    case 'Teams':
      return 'teams';
    case 'Backoffice':
      return 'admin';
    default:
      return 'auth';
  }
}

const TEAM_PUBLIC_SUFFIX_OVERRIDES: Record<string, string> = {
  '/organization/create-team': '/create',
  '/organization/list-teams': '/list',
  '/organization/remove-team': '/remove',
  '/organization/update-team': '/update',
  '/organization/set-active-team': '/set/active',
  '/organization/list-team-members': '/members',
  '/organization/add-team-member': '/add/member',
  '/organization/remove-team-member': '/remove/member',
  '/organization/list-user-teams': '/user',
};

function toGroupPublicSuffix(
  internalPath: string,
  routeGroup: ApiRouteGroup,
): string {
  if (routeGroup === 'user' && internalPath === '/get-session') {
    return '/profile';
  }

  if (routeGroup === 'teams') {
    const teamOverride = TEAM_PUBLIC_SUFFIX_OVERRIDES[internalPath];
    if (teamOverride) {
      return teamOverride;
    }
  }

  if (
    routeGroup === 'organisation' &&
    internalPath.startsWith('/organization/')
  ) {
    const rest = internalPath.slice('/organization/'.length);
    return `/${rest
      .split('/')
      .map((segment) => segment.replace(/-/g, '/'))
      .join('/')}`;
  }

  if (routeGroup === 'admin' && internalPath.startsWith('/admin/')) {
    const rest = internalPath.slice('/admin/'.length);
    return `/${rest
      .split('/')
      .map((segment) => segment.replace(/-/g, '/'))
      .join('/')}`;
  }

  return toPublicSuffix(internalPath);
}

function entry(
  internalPath: string,
  options: Omit<
    AuthApiCatalogEntry,
    'internalPath' | 'publicSuffix' | 'legacyAuthPublicSuffix' | 'routeGroup'
  > & {
    publicSuffix?: string;
    routeGroup?: ApiRouteGroup;
  },
): AuthApiCatalogEntry {
  const routeGroup = options.routeGroup ?? routeGroupFromTag(options.tag);

  return {
    internalPath,
    routeGroup,
    publicSuffix:
      options.publicSuffix ?? toGroupPublicSuffix(internalPath, routeGroup),
    legacyAuthPublicSuffix: toPublicSuffix(internalPath),
    method: options.method,
    summary: options.summary,
    tag: options.tag,
    security: options.security,
    requestExample: options.requestExample,
    responseSampleId: options.responseSampleId,
  };
}

export function catalogPublicPath(entry: AuthApiCatalogEntry): string {
  return `${ROUTE_GROUP_BASE[entry.routeGroup]}${entry.publicSuffix}`;
}

export function buildApiRouteRewrites(): Array<{
  public: string;
  internal: string;
}> {
  return AUTH_API_CATALOG.map((catalogEntry) => ({
    public: catalogPublicPath(catalogEntry),
    internal: `${ROUTE_GROUP_BASE.auth}${catalogEntry.internalPath}`,
  }));
}

export const AUTH_API_CATALOG: AuthApiCatalogEntry[] = [
  entry('/ok', {
    method: 'get',
    summary: 'Auth health check',
    tag: 'Server',
    security: 'public',
    responseSampleId: 'authOk',
  }),
  entry('/sign-up/email', {
    method: 'post',
    summary: 'Sign up with email and password',
    tag: 'Auth',
    security: 'public',
    requestExample: {
      email: 'alex@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'Alex',
      lastName: 'Example',
      referralCode: 'ref_a1b2c3d4e5f60718',
    },
    responseSampleId: 'signUpEmail',
  }),
  entry('/sign-in/email', {
    method: 'post',
    summary: 'Sign in with email and password',
    tag: 'Auth',
    security: 'public',
    requestExample: {
      email: 'alex@example.com',
      password: 'SecurePass123!',
    },
    responseSampleId: 'signInEmail',
  }),
  entry('/sign-out', {
    method: 'post',
    summary: 'Sign out current session',
    tag: 'Auth',
    security: 'session',
    responseSampleId: 'signOut',
  }),
  entry('/email-otp/send-verification-otp', {
    method: 'post',
    summary: 'Send verification OTP',
    tag: 'Auth',
    security: 'public',
    requestExample: { email: 'alex@example.com', type: 'email-verification' },
    responseSampleId: 'sendVerificationOtp',
  }),
  entry('/email-otp/check-verification-otp', {
    method: 'post',
    summary: 'Check verification OTP',
    tag: 'Auth',
    security: 'public',
    requestExample: {
      email: 'alex@example.com',
      type: 'email-verification',
      otp: '123456',
    },
    responseSampleId: 'checkVerificationOtp',
  }),
  entry('/email-otp/verify-email', {
    method: 'post',
    summary: 'Verify email with OTP',
    tag: 'Auth',
    security: 'public',
    requestExample: { email: 'alex@example.com', otp: '123456' },
    responseSampleId: 'verifyEmailOtp',
  }),
  entry('/sign-in/email-otp', {
    method: 'post',
    summary: 'Sign in with email OTP',
    tag: 'Auth',
    security: 'public',
    requestExample: { email: 'alex@example.com', otp: '123456' },
    responseSampleId: 'signInEmailOtp',
  }),
  entry('/email-otp/request-password-reset', {
    method: 'post',
    summary: 'Request password reset OTP',
    tag: 'Auth',
    security: 'public',
    requestExample: { email: 'alex@example.com' },
    responseSampleId: 'requestPasswordResetOtp',
  }),
  entry('/email-otp/reset-password', {
    method: 'post',
    summary: 'Reset password with OTP',
    tag: 'Auth',
    security: 'public',
    requestExample: {
      email: 'alex@example.com',
      otp: '123456',
      password: 'NewSecurePass123!',
    },
    responseSampleId: 'resetPasswordOtp',
  }),
  entry('/get-session', {
    method: 'get',
    summary: 'Get current user profile',
    tag: 'User',
    security: 'session',
    responseSampleId: 'getSession',
  }),
  entry('/token', {
    method: 'get',
    summary:
      'Get bearer token for current session (requires JWT plugin at runtime; otherwise use set-auth-token header from sign-in)',
    tag: 'Auth',
    security: 'session',
    responseSampleId: 'bearerToken',
  }),
  entry('/sign-in/social', {
    method: 'post',
    summary: 'Sign in with social provider',
    tag: 'Auth',
    security: 'public',
    requestExample: {
      provider: 'google',
      callbackURL: 'https://app.example.com/dashboard',
    },
    responseSampleId: 'signInSocial',
  }),
  entry('/passkey/verify-authentication', {
    method: 'post',
    summary: 'Sign in with passkey',
    tag: 'Auth',
    security: 'public',
    requestExample: { credential: { id: 'passkey-credential-id' } },
    responseSampleId: 'signInPasskey',
  }),
  entry('/two-factor/verify-totp', {
    method: 'post',
    summary: 'Verify two factor TOTP code during sign-in',
    tag: 'Auth',
    security: 'public',
    requestExample: { code: '123456' },
    responseSampleId: 'verify2fa',
  }),
  entry('/two-factor/verify-otp', {
    method: 'post',
    summary: 'Verify two factor OTP during sign-in',
    tag: 'Auth',
    security: 'public',
    requestExample: { code: '123456' },
    responseSampleId: 'verify2faOtp',
  }),
  entry('/two-factor/verify-backup-code', {
    method: 'post',
    summary: 'Verify two factor backup code during sign-in',
    tag: 'Auth',
    security: 'public',
    requestExample: { code: 'abc123def4' },
    responseSampleId: 'verify2faBackup',
  }),
  entry('/update-user', {
    method: 'post',
    summary: 'Update current user profile',
    tag: 'User',
    security: 'session',
    requestExample: { firstName: 'Alex', lastName: 'Example' },
    responseSampleId: 'updateUser',
  }),
  entry('/change-password', {
    method: 'post',
    summary: 'Change password for current user',
    tag: 'User',
    security: 'session',
    requestExample: {
      currentPassword: 'SecurePass123!',
      newPassword: 'NewSecurePass123!',
      revokeOtherSessions: true,
    },
    responseSampleId: 'changePassword',
  }),
  entry('/list-sessions', {
    method: 'get',
    summary: 'List active sessions for current user',
    tag: 'User',
    security: 'session',
    responseSampleId: 'listSessions',
  }),
  entry('/revoke-session', {
    method: 'post',
    summary: 'Revoke a single session by token',
    tag: 'User',
    security: 'session',
    requestExample: { token: 'session-token-example' },
    responseSampleId: 'revokeSession',
  }),
  entry('/revoke-sessions', {
    method: 'post',
    summary: 'Revoke all sessions for current user',
    tag: 'User',
    security: 'session',
    responseSampleId: 'revokeSessions',
  }),
  entry('/revoke-other-sessions', {
    method: 'post',
    summary: 'Revoke all sessions except the current one',
    tag: 'User',
    security: 'session',
    responseSampleId: 'revokeOtherSessions',
  }),
  entry('/update-session', {
    method: 'post',
    summary: 'Update current session custom fields',
    tag: 'User',
    security: 'session',
    requestExample: { theme: 'dark' },
    responseSampleId: 'updateSession',
  }),
  entry('/list-accounts', {
    method: 'get',
    summary: 'List linked accounts for current user',
    tag: 'User',
    security: 'session',
    responseSampleId: 'listAccounts',
  }),
  entry('/link-social', {
    method: 'post',
    summary: 'Link a social provider to current user',
    tag: 'User',
    security: 'session',
    requestExample: {
      provider: 'google',
      callbackURL: 'https://app.example.com/dashboard',
    },
    responseSampleId: 'linkSocial',
  }),
  entry('/unlink-account', {
    method: 'post',
    summary: 'Unlink a provider account',
    tag: 'User',
    security: 'session',
    requestExample: { providerId: 'google' },
    responseSampleId: 'unlinkAccount',
  }),
  entry('/get-access-token', {
    method: 'post',
    summary: 'Get OAuth access token for a linked provider',
    tag: 'User',
    security: 'session',
    requestExample: { providerId: 'google' },
    responseSampleId: 'getAccessToken',
  }),
  entry('/passkey/generate-register-options', {
    method: 'post',
    summary: 'Start passkey registration',
    tag: 'User',
    security: 'session',
    requestExample: { name: 'MacBook Pro Touch ID' },
    responseSampleId: 'registerPasskey',
  }),
  entry('/passkey/verify-registration', {
    method: 'post',
    summary: 'Complete passkey registration',
    tag: 'User',
    security: 'session',
    requestExample: { credential: { id: 'passkey-credential-id' } },
    responseSampleId: 'verifyPasskeyRegistration',
  }),
  entry('/passkey/list-user-passkeys', {
    method: 'get',
    summary: 'List passkeys for current user',
    tag: 'User',
    security: 'session',
    responseSampleId: 'listPasskeys',
  }),
  entry('/passkey/update-passkey', {
    method: 'post',
    summary: 'Update a passkey name',
    tag: 'User',
    security: 'session',
    requestExample: { id: 'passkey-credential-id', name: 'Work laptop' },
    responseSampleId: 'updatePasskey',
  }),
  entry('/passkey/delete-passkey', {
    method: 'post',
    summary: 'Delete a passkey',
    tag: 'User',
    security: 'session',
    requestExample: { id: 'passkey-credential-id' },
    responseSampleId: 'deletePasskey',
  }),
  entry('/two-factor/enable', {
    method: 'post',
    summary: 'Enable two factor authentication',
    tag: 'User',
    security: 'session',
    requestExample: { password: 'SecurePass123!' },
    responseSampleId: 'enable2fa',
  }),
  entry('/two-factor/disable', {
    method: 'post',
    summary: 'Disable two factor authentication',
    tag: 'User',
    security: 'session',
    requestExample: { code: '123456' },
    responseSampleId: 'disable2fa',
  }),
  entry('/two-factor/send-otp', {
    method: 'post',
    summary: 'Send two factor OTP',
    tag: 'User',
    security: 'session',
    responseSampleId: 'send2faOtp',
  }),
  entry('/two-factor/get-totp-uri', {
    method: 'get',
    summary: 'Get TOTP URI for authenticator setup',
    tag: 'User',
    security: 'session',
    responseSampleId: 'get2faTotpUri',
  }),
  entry('/two-factor/generate-backup-codes', {
    method: 'post',
    summary: 'Generate two factor backup codes',
    tag: 'User',
    security: 'session',
    responseSampleId: 'generate2faBackupCodes',
  }),
  entry('/organization/create', {
    method: 'post',
    summary: 'Create organization',
    tag: 'Organisation',
    security: 'session',
    requestExample: { name: 'Acme Billing', slug: 'acme-billing' },
    responseSampleId: 'createOrganization',
  }),
  entry('/organization/invite-member', {
    method: 'post',
    summary: 'Invite organization member',
    tag: 'Organisation',
    security: 'session',
    requestExample: { email: 'member@example.com', role: 'member' },
    responseSampleId: 'inviteMember',
  }),
  entry('/organization/accept-invitation', {
    method: 'post',
    summary: 'Accept organization invitation',
    tag: 'Organisation',
    security: 'session',
    requestExample: { invitationId: 'inv_01HXYZ000000000000000000' },
    responseSampleId: 'acceptInvitation',
  }),
  entry('/organization/list', {
    method: 'get',
    summary: 'List organizations',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'listOrganizations',
  }),
  entry('/organization/set-active', {
    method: 'post',
    summary: 'Set active organization',
    tag: 'Organisation',
    security: 'session',
    requestExample: { organizationId: 'org_01HXYZ000000000000000000' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/get-full-organization', {
    method: 'get',
    summary: 'Get full organization details',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgOp',
  }),
  entry('/organization/get-active-member', {
    method: 'get',
    summary: 'Get active organization member',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgMember',
  }),
  entry('/organization/get-active-member-role', {
    method: 'get',
    summary: 'Get active organization member role',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgMember',
  }),
  entry('/organization/update', {
    method: 'post',
    summary: 'Update organization',
    tag: 'Organisation',
    security: 'session',
    requestExample: { name: 'Acme Billing Updated' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/delete', {
    method: 'post',
    summary: 'Delete organization',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgOp',
  }),
  entry('/organization/leave', {
    method: 'post',
    summary: 'Leave organization',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgMember',
  }),
  entry('/organization/check-slug', {
    method: 'post',
    summary: 'Check organization slug availability',
    tag: 'Organisation',
    security: 'session',
    requestExample: { slug: 'acme-billing' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/list-members', {
    method: 'get',
    summary: 'List organization members',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgList',
  }),
  entry('/organization/remove-member', {
    method: 'post',
    summary: 'Remove organization member',
    tag: 'Organisation',
    security: 'session',
    requestExample: { memberId: 'mem_01HXYZ000000000000000000' },
    responseSampleId: 'orgMember',
  }),
  entry('/organization/update-member-role', {
    method: 'post',
    summary: 'Update organization member role',
    tag: 'Organisation',
    security: 'session',
    requestExample: { memberId: 'mem_01HXYZ000000000000000000', role: 'admin' },
    responseSampleId: 'orgMember',
  }),
  entry('/organization/list-invitations', {
    method: 'get',
    summary: 'List organization invitations',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgList',
  }),
  entry('/organization/cancel-invitation', {
    method: 'post',
    summary: 'Cancel organization invitation',
    tag: 'Organisation',
    security: 'session',
    requestExample: { invitationId: 'inv_01HXYZ000000000000000000' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/reject-invitation', {
    method: 'post',
    summary: 'Reject organization invitation',
    tag: 'Organisation',
    security: 'session',
    requestExample: { invitationId: 'inv_01HXYZ000000000000000000' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/get-invitation', {
    method: 'get',
    summary: 'Get organization invitation',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgOp',
  }),
  entry('/organization/list-user-invitations', {
    method: 'get',
    summary: 'List invitations for current user',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgList',
  }),
  entry('/organization/create-team', {
    method: 'post',
    summary: 'Create organization team',
    tag: 'Teams',
    security: 'session',
    requestExample: { name: 'Engineering' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/list-teams', {
    method: 'get',
    summary: 'List organization teams',
    tag: 'Teams',
    security: 'session',
    responseSampleId: 'orgList',
  }),
  entry('/organization/remove-team', {
    method: 'post',
    summary: 'Remove organization team',
    tag: 'Teams',
    security: 'session',
    requestExample: { teamId: 'team_01HXYZ000000000000000000' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/update-team', {
    method: 'post',
    summary: 'Update organization team',
    tag: 'Teams',
    security: 'session',
    requestExample: {
      teamId: 'team_01HXYZ000000000000000000',
      name: 'Platform',
    },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/set-active-team', {
    method: 'post',
    summary: 'Set active organization team',
    tag: 'Teams',
    security: 'session',
    requestExample: { teamId: 'team_01HXYZ000000000000000000' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/list-team-members', {
    method: 'get',
    summary: 'List organization team members',
    tag: 'Teams',
    security: 'session',
    responseSampleId: 'orgList',
  }),
  entry('/organization/add-team-member', {
    method: 'post',
    summary: 'Add member to organization team',
    tag: 'Teams',
    security: 'session',
    requestExample: {
      teamId: 'team_01HXYZ000000000000000000',
      userId: 'usr_01HXYZ000000000000000000',
    },
    responseSampleId: 'orgMember',
  }),
  entry('/organization/remove-team-member', {
    method: 'post',
    summary: 'Remove member from organization team',
    tag: 'Teams',
    security: 'session',
    requestExample: {
      teamId: 'team_01HXYZ000000000000000000',
      userId: 'usr_01HXYZ000000000000000000',
    },
    responseSampleId: 'orgMember',
  }),
  entry('/organization/list-user-teams', {
    method: 'get',
    summary: 'List teams for current user',
    tag: 'Teams',
    security: 'session',
    responseSampleId: 'orgList',
  }),
  entry('/organization/create-role', {
    method: 'post',
    summary: 'Create organization role',
    tag: 'Organisation',
    security: 'session',
    requestExample: { role: 'billing-admin', permission: {} },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/list-roles', {
    method: 'get',
    summary: 'List organization roles',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgList',
  }),
  entry('/organization/get-role', {
    method: 'get',
    summary: 'Get organization role',
    tag: 'Organisation',
    security: 'session',
    responseSampleId: 'orgOp',
  }),
  entry('/organization/update-role', {
    method: 'post',
    summary: 'Update organization role',
    tag: 'Organisation',
    security: 'session',
    requestExample: { roleId: 'role_01HXYZ000000000000000000' },
    responseSampleId: 'orgOp',
  }),
  entry('/organization/delete-role', {
    method: 'post',
    summary: 'Delete organization role',
    tag: 'Organisation',
    security: 'session',
    requestExample: { roleId: 'role_01HXYZ000000000000000000' },
    responseSampleId: 'orgOp',
  }),
  entry('/admin/list-users', {
    method: 'get',
    summary: 'List users (admin)',
    tag: 'Backoffice',
    security: 'admin',
    responseSampleId: 'listUsers',
  }),
  entry('/admin/ban-user', {
    method: 'post',
    summary: 'Ban user (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: {
      userId: 'usr_01HXYZ000000000000000000',
      banReason: 'Terms of service violation',
    },
    responseSampleId: 'banUser',
  }),
  entry('/admin/unban-user', {
    method: 'post',
    summary: 'Unban user (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: { userId: 'usr_01HXYZ000000000000000000' },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/create-user', {
    method: 'post',
    summary: 'Create user (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
    },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/get-user', {
    method: 'get',
    summary: 'Get user (admin)',
    tag: 'Backoffice',
    security: 'admin',
    responseSampleId: 'adminOp',
  }),
  entry('/admin/update-user', {
    method: 'post',
    summary: 'Update user (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: {
      userId: 'usr_01HXYZ000000000000000000',
      name: 'Updated Name',
    },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/remove-user', {
    method: 'post',
    summary: 'Remove user (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: { userId: 'usr_01HXYZ000000000000000000' },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/set-role', {
    method: 'post',
    summary: 'Set user role (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: { userId: 'usr_01HXYZ000000000000000000', role: 'admin' },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/set-user-password', {
    method: 'post',
    summary: 'Set user password (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: {
      userId: 'usr_01HXYZ000000000000000000',
      newPassword: 'SecurePass123!',
    },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/impersonate-user', {
    method: 'post',
    summary: 'Impersonate user (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: { userId: 'usr_01HXYZ000000000000000000' },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/stop-impersonating', {
    method: 'post',
    summary: 'Stop impersonating user (admin)',
    tag: 'Backoffice',
    security: 'admin',
    responseSampleId: 'adminOp',
  }),
  entry('/admin/list-user-sessions', {
    method: 'post',
    summary: 'List user sessions (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: { userId: 'usr_01HXYZ000000000000000000' },
    responseSampleId: 'adminSessions',
  }),
  entry('/admin/revoke-user-session', {
    method: 'post',
    summary: 'Revoke user session (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: {
      sessionToken: 'session-token-example',
      userId: 'usr_01HXYZ000000000000000000',
    },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/revoke-user-sessions', {
    method: 'post',
    summary: 'Revoke all user sessions (admin)',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: { userId: 'usr_01HXYZ000000000000000000' },
    responseSampleId: 'adminOp',
  }),
  entry('/admin/has-permission', {
    method: 'post',
    summary: 'Check admin permission',
    tag: 'Backoffice',
    security: 'admin',
    requestExample: { permission: { user: ['list'] } },
    responseSampleId: 'adminOp',
  }),
];

/** Public suffixes covered by existing auth e2e specs. */
export const AUTH_E2E_COVERED_PUBLIC_SUFFIXES = [
  '/ok',
  '/sign/up/email',
  '/sign/in/email',
  '/sign/out',
  '/email/otp/send',
  '/email/otp/verify',
  '/email/otp/request/password/reset',
  '/email/otp/reset/password',
  '/sign/in/email/otp',
  '/token',
  '/sign/in/social',
  '/passkey/register',
  '/passkey/sign/in',
  '/two/factor/verify',
] as const;

export const USER_E2E_COVERED_PUBLIC_SUFFIXES = [
  '/profile',
  '/two/factor/enable',
  '/two/factor/disable',
] as const;

export const ORGANISATION_E2E_COVERED_PUBLIC_SUFFIXES = [
  '/create',
  '/invite/member',
  '/accept/invitation',
  '/list',
] as const;

export const TEAMS_E2E_COVERED_PUBLIC_SUFFIXES = ['/create', '/list'] as const;

export const ADMIN_E2E_COVERED_PUBLIC_SUFFIXES = [
  '/list/users',
  '/ban/user',
] as const;

export function buildAuthRouteRewrites(): Array<{
  public: string;
  internal: string;
}> {
  return buildApiRouteRewrites();
}

export function catalogEntryNeedsRewrite(entry: AuthApiCatalogEntry): boolean {
  return (
    catalogPublicPath(entry) !== `${ROUTE_GROUP_BASE.auth}${entry.internalPath}`
  );
}
