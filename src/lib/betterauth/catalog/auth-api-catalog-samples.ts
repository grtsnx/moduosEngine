import {
  SAMPLE_BEARER_TOKEN,
  SAMPLE_ORGANIZATION,
  SAMPLE_PASSKEY_CREDENTIAL,
  SAMPLE_SESSION,
  SAMPLE_TWO_FACTOR_SECRET,
  SAMPLE_USER,
} from '../../../dto/auth/samples';

function success(
  message: string,
  data: Record<string, unknown> = { success: true },
) {
  return {
    statusCode: 200,
    statusType: 'OK' as const,
    message,
    data,
  };
}

const orgOp = success('Organization operation completed successfully', {
  organization: SAMPLE_ORGANIZATION,
});
const orgList = success('Organization operation completed successfully', {
  items: [SAMPLE_ORGANIZATION],
});
const orgMember = success('Organization operation completed successfully', {
  member: { organizationId: SAMPLE_ORGANIZATION.id, role: 'member' },
});
const adminOp = success('Admin operation completed successfully', {
  user: SAMPLE_USER,
});
const adminSessions = success('Admin operation completed successfully', {
  sessions: [SAMPLE_SESSION],
});

export const AUTH_API_RESPONSE_SAMPLES = {
  authOk: success('Auth service is healthy', { status: 'ok' }),
  signUpEmail: success('Account created. Verify your email to sign in.', {
    user: SAMPLE_USER,
  }),
  signInEmail: success('Signed in successfully', {
    user: SAMPLE_USER,
    session: SAMPLE_SESSION,
  }),
  signOut: success('Signed out successfully', { success: true }),
  getSession: success('Profile retrieved', {
    user: SAMPLE_USER,
    session: SAMPLE_SESSION,
  }),
  sendVerificationOtp: success('Verification OTP sent', { success: true }),
  checkVerificationOtp: success('OTP is valid', { success: true }),
  verifyEmailOtp: success('Email verified successfully', {
    success: true,
    token: SAMPLE_BEARER_TOKEN,
    user: SAMPLE_USER,
  }),
  signInEmailOtp: success('Signed in successfully', {
    user: SAMPLE_USER,
    session: SAMPLE_SESSION,
  }),
  requestPasswordResetOtp: success('Password reset OTP sent', {
    success: true,
  }),
  resetPasswordOtp: success('Password reset successfully', { success: true }),
  bearerToken: success('Request completed successfully', {
    token: SAMPLE_BEARER_TOKEN,
  }),
  signInSocial: success('Social sign-in initiated', {
    url: 'https://accounts.google.com/o/oauth2/auth',
  }),
  signInPasskey: success('Signed in with passkey successfully', {
    user: SAMPLE_USER,
    session: SAMPLE_SESSION,
  }),
  verify2fa: success('Two-factor code verified', { success: true }),
  verify2faOtp: success('Two-factor code verified', { success: true }),
  verify2faBackup: success('Two-factor code verified', { success: true }),
  updateUser: success('Request completed successfully', { user: SAMPLE_USER }),
  changePassword: success('Request completed successfully', {
    user: SAMPLE_USER,
  }),
  listSessions: success('Request completed successfully', {
    sessions: [SAMPLE_SESSION],
  }),
  revokeSession: success('Request completed successfully'),
  revokeSessions: success('Request completed successfully'),
  revokeOtherSessions: success('Request completed successfully'),
  updateSession: success('Request completed successfully', {
    session: SAMPLE_SESSION,
  }),
  listAccounts: success('Request completed successfully', {
    accounts: [
      {
        id: 'acc_01HXYZ000000000000000000',
        providerId: 'credential',
        accountId: SAMPLE_USER.id,
      },
    ],
  }),
  linkSocial: success('Request completed successfully', {
    url: 'https://accounts.google.com/o/oauth2/auth',
  }),
  unlinkAccount: success('Request completed successfully'),
  getAccessToken: success('Request completed successfully', {
    accessToken: 'provider-access-token-example',
  }),
  registerPasskey: success('Passkey registered successfully', {
    passkey: SAMPLE_PASSKEY_CREDENTIAL,
  }),
  verifyPasskeyRegistration: success('Passkey registered successfully', {
    passkey: SAMPLE_PASSKEY_CREDENTIAL,
  }),
  listPasskeys: success('Request completed successfully', {
    passkeys: [SAMPLE_PASSKEY_CREDENTIAL],
  }),
  updatePasskey: success('Request completed successfully', {
    passkey: SAMPLE_PASSKEY_CREDENTIAL,
  }),
  deletePasskey: success('Request completed successfully', { success: true }),
  enable2fa: success('Two-factor authentication enabled', {
    totpURI: `otpauth://totp/penielvault:alex@example.com?secret=${SAMPLE_TWO_FACTOR_SECRET}`,
    backupCodes: ['abc123', 'def456'],
  }),
  disable2fa: success('Two-factor authentication disabled', { success: true }),
  send2faOtp: success('Request completed successfully', { success: true }),
  get2faTotpUri: success('Request completed successfully', {
    totpURI: `otpauth://totp/penielvault:alex@example.com?secret=${SAMPLE_TWO_FACTOR_SECRET}`,
  }),
  generate2faBackupCodes: success('Request completed successfully', {
    backupCodes: ['abc123', 'def456'],
  }),
  createOrganization: success('Organization created successfully', {
    organization: SAMPLE_ORGANIZATION,
  }),
  inviteMember: success('Invitation sent successfully', {
    invitationId: 'inv_01HXYZ000000000000000000',
  }),
  acceptInvitation: success('Invitation accepted successfully', {
    member: { organizationId: SAMPLE_ORGANIZATION.id, role: 'member' },
  }),
  listOrganizations: success('Organizations retrieved successfully', {
    organizations: [SAMPLE_ORGANIZATION],
  }),
  listUsers: success('Users retrieved successfully', {
    users: [SAMPLE_USER],
    total: 1,
  }),
  banUser: success('User banned successfully', {
    user: { ...SAMPLE_USER, banned: true },
  }),
  orgOp,
  orgList,
  orgMember,
  adminOp,
  adminSessions,
} as const;

export type AuthApiResponseSampleId = keyof typeof AUTH_API_RESPONSE_SAMPLES;
