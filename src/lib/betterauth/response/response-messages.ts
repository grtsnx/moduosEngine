const SUCCESS_MESSAGES: Record<string, string> = {
  '/ok': 'Auth service is healthy',
  '/sign-up/email': 'Account created. Verify your email to sign in.',
  '/sign-in/email': 'Signed in successfully',
  '/sign-out': 'Signed out successfully',
  '/get-session': 'Profile retrieved',
  '/list-sessions': 'Sessions retrieved successfully',
  '/revoke-session': 'Session revoked successfully',
  '/revoke-sessions': 'Sessions revoked successfully',
  '/revoke-other-sessions': 'Other sessions revoked successfully',
  '/update-session': 'Session updated successfully',
  '/update-user': 'Profile updated successfully',
  '/change-password': 'Password changed successfully',
  '/list-accounts': 'Accounts retrieved successfully',
  '/link-social': 'Social account linked successfully',
  '/unlink-account': 'Account unlinked successfully',
  '/get-access-token': 'Access token retrieved successfully',
  '/email-otp/send-verification-otp': 'Verification OTP sent',
  '/email-otp/check-verification-otp': 'OTP is valid',
  '/email-otp/verify-email': 'Email verified successfully',
  '/sign-in/email-otp': 'Signed in successfully',
  '/email-otp/request-password-reset': 'Password reset OTP sent',
  '/email-otp/reset-password': 'Password reset successfully',
  '/sign-in/social': 'Social sign-in initiated',
  '/passkey/generate-register-options': 'Passkey registration initiated',
  '/passkey/verify-registration': 'Passkey registered successfully',
  '/passkey/generate-authenticate-options': 'Passkey sign-in initiated',
  '/passkey/verify-authentication': 'Signed in with passkey successfully',
  '/passkey/register': 'Passkey registered successfully',
  '/passkey/sign-in': 'Signed in with passkey successfully',
  '/two-factor/enable': 'Two-factor authentication enabled',
  '/two-factor/verify-totp': 'Two-factor code verified',
  '/two-factor/verify-otp': 'Two-factor code verified',
  '/two-factor/verify-backup-code': 'Two-factor code verified',
  '/two-factor/verify': 'Two-factor code verified',
  '/two-factor/disable': 'Two-factor authentication disabled',
  '/organization/create': 'Organization created successfully',
  '/organization/invite-member': 'Invitation sent successfully',
  '/organization/accept-invitation': 'Invitation accepted successfully',
  '/organization/list': 'Organizations retrieved successfully',
  '/admin/list-users': 'Users retrieved successfully',
  '/admin/ban-user': 'User banned successfully',
};

function matchPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function resolveSuccessMessage(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (SUCCESS_MESSAGES[normalized]) {
    return SUCCESS_MESSAGES[normalized];
  }

  for (const [route, message] of Object.entries(SUCCESS_MESSAGES)) {
    if (matchPrefix(normalized, route)) {
      return message;
    }
  }

  if (matchPrefix(normalized, '/organization')) {
    return 'Organization operation completed successfully';
  }

  if (matchPrefix(normalized, '/admin')) {
    return 'Admin operation completed successfully';
  }

  if (matchPrefix(normalized, '/two-factor')) {
    return 'Two-factor operation completed successfully';
  }

  if (matchPrefix(normalized, '/passkey')) {
    return 'Passkey operation completed successfully';
  }

  if (matchPrefix(normalized, '/email-otp')) {
    return 'OTP operation completed successfully';
  }

  return 'Request completed successfully';
}

const MESSAGE_ONLY_SUCCESS_PATHS = [
  '/email-otp/send-verification-otp',
  '/email-otp/request-password-reset',
] as const;

export function shouldTreatMessageOnlyReturnAsError(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  return !MESSAGE_ONLY_SUCCESS_PATHS.some(
    (route) => normalized === route || normalized.startsWith(`${route}/`),
  );
}
