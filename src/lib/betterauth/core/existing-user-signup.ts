import type { Auth } from './auth-options';

let authInstance: Auth | null = null;

export function registerAuthForExistingUserSignUp(auth: Auth): void {
  authInstance = auth;
}

export function resetAuthForExistingUserSignUp(): void {
  authInstance = null;
}

export async function handleExistingUserSignUp(user: {
  email: string;
  emailVerified: boolean;
}): Promise<void> {
  if (user.emailVerified || authInstance === null) {
    return;
  }

  await authInstance.api.sendVerificationOTP({
    body: {
      email: user.email,
      type: 'email-verification',
    },
  });
}
