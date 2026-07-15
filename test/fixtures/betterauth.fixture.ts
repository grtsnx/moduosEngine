import {
  SAMPLE_ACCEPT_INVITATION_RESPONSE,
  SAMPLE_AUTH_OK_RESPONSE,
  SAMPLE_BAN_USER_RESPONSE,
  SAMPLE_BEARER_TOKEN_RESPONSE,
  SAMPLE_CREATE_ORGANIZATION_RESPONSE,
  SAMPLE_DISABLE_2FA_RESPONSE,
  SAMPLE_ENABLE_2FA_RESPONSE,
  SAMPLE_GET_SESSION_RESPONSE,
  SAMPLE_INVITE_MEMBER_RESPONSE,
  SAMPLE_LIST_ORGANIZATIONS_RESPONSE,
  SAMPLE_LIST_USERS_RESPONSE,
  SAMPLE_REGISTER_PASSKEY_RESPONSE,
  SAMPLE_REQUEST_PASSWORD_RESET_RESPONSE,
  SAMPLE_RESET_PASSWORD_RESPONSE,
  SAMPLE_SEND_VERIFICATION_OTP_RESPONSE,
  SAMPLE_SIGN_IN_EMAIL_OTP_RESPONSE,
  SAMPLE_SIGN_IN_EMAIL_RESPONSE,
  SAMPLE_SIGN_IN_PASSKEY_RESPONSE,
  SAMPLE_SIGN_IN_SOCIAL_RESPONSE,
  SAMPLE_SIGN_OUT_RESPONSE,
  SAMPLE_SIGN_UP_EMAIL_RESPONSE,
  SAMPLE_USER,
  SAMPLE_VERIFY_2FA_RESPONSE,
  SAMPLE_VERIFY_EMAIL_OTP_RESPONSE,
} from 'src/dto';

export const testUser = SAMPLE_USER;
export const testAdminUser = { ...SAMPLE_USER, role: 'admin' };
export const unverifiedUser = { ...SAMPLE_USER, emailVerified: false };
export const bannedUser = { ...SAMPLE_USER, banned: true };

export const validEmail = 'alex@example.com';
export const invalidEmail = 'not-an-email';
export const compromisedPassword = 'Password123!';
export const validPassword = 'SecurePass123!';
export const weakPassword = 'short';
export const complexityWeakPassword = 'abcdefghijkl';
export const borderlinePassword = 'SecurePass1';
export const longPassword = `${'SecurePass123!'.repeat(20)}x`;

export const signUpRequest = {
  email: validEmail,
  password: validPassword,
  confirmPassword: validPassword,
  firstName: 'Alex',
  lastName: 'Example',
};

export const signInRequest = {
  email: validEmail,
  password: validPassword,
};

export const authOkResponse = SAMPLE_AUTH_OK_RESPONSE;
export const signUpResponse = SAMPLE_SIGN_UP_EMAIL_RESPONSE;
export const signInResponse = SAMPLE_SIGN_IN_EMAIL_RESPONSE;
export const signOutResponse = SAMPLE_SIGN_OUT_RESPONSE;
export const getSessionResponse = SAMPLE_GET_SESSION_RESPONSE;
export const requestPasswordResetResponse =
  SAMPLE_REQUEST_PASSWORD_RESET_RESPONSE;
export const resetPasswordResponse = SAMPLE_RESET_PASSWORD_RESPONSE;
export const sendVerificationResponse = SAMPLE_SEND_VERIFICATION_OTP_RESPONSE;
export const verifyEmailResponse = SAMPLE_VERIFY_EMAIL_OTP_RESPONSE;
export const signInSocialResponse = SAMPLE_SIGN_IN_SOCIAL_RESPONSE;
export const signInEmailOtpResponse = SAMPLE_SIGN_IN_EMAIL_OTP_RESPONSE;
export const registerPasskeyResponse = SAMPLE_REGISTER_PASSKEY_RESPONSE;
export const signInPasskeyResponse = SAMPLE_SIGN_IN_PASSKEY_RESPONSE;
export const enable2faResponse = SAMPLE_ENABLE_2FA_RESPONSE;
export const verify2faResponse = SAMPLE_VERIFY_2FA_RESPONSE;
export const disable2faResponse = SAMPLE_DISABLE_2FA_RESPONSE;
export const createOrganizationResponse = SAMPLE_CREATE_ORGANIZATION_RESPONSE;
export const inviteMemberResponse = SAMPLE_INVITE_MEMBER_RESPONSE;
export const acceptInvitationResponse = SAMPLE_ACCEPT_INVITATION_RESPONSE;
export const listOrganizationsResponse = SAMPLE_LIST_ORGANIZATIONS_RESPONSE;
export const listUsersResponse = SAMPLE_LIST_USERS_RESPONSE;
export const banUserResponse = SAMPLE_BAN_USER_RESPONSE;
export const bearerTokenResponse = SAMPLE_BEARER_TOKEN_RESPONSE;

export const mockSession = signInResponse.data.session;
export const mockBearerToken = bearerTokenResponse.data.token;
export const mockTotpSecret = enable2faResponse.data.totpURI;
export const mockBackupCodes = enable2faResponse.data.backupCodes;

export const createOrganizationRequest = {
  name: 'Acme Billing',
  slug: 'acme-billing',
};

export const inviteMemberRequest = {
  email: 'member@example.com',
  role: 'member',
};

export const passkeySignInRequest = {
  credential: { id: 'passkey-credential-id' },
};

export const oauthStateMock = {
  provider: 'google',
  callbackURL: 'https://app.example.com/dashboard',
};

export const maliciousCallbackUrl = 'https://evil.example.com/phishing';
export const maliciousRedirectTo = 'https://evil.example.com/reset-password';
export const malformedCallbackUrl = 'javascript:alert(1)';
