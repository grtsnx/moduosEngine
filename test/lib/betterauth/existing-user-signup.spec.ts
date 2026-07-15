import {
  handleExistingUserSignUp,
  registerAuthForExistingUserSignUp,
  resetAuthForExistingUserSignUp,
} from 'src/lib/betterauth/core/existing-user-signup';

describe('existing-user-signup', () => {
  afterEach(() => {
    resetAuthForExistingUserSignUp();
  });

  it('resends verification OTP for unverified existing users', async () => {
    const sendVerificationOTP = jest.fn().mockResolvedValue({ success: true });
    registerAuthForExistingUserSignUp({
      api: { sendVerificationOTP },
    } as never);

    await handleExistingUserSignUp({
      email: 'user@example.com',
      emailVerified: false,
    });

    expect(sendVerificationOTP).toHaveBeenCalledWith({
      body: { email: 'user@example.com', type: 'email-verification' },
    });
  });

  it('skips OTP resend when the user is already verified', async () => {
    const sendVerificationOTP = jest.fn().mockResolvedValue({ success: true });
    registerAuthForExistingUserSignUp({
      api: { sendVerificationOTP },
    } as never);

    await handleExistingUserSignUp({
      email: 'user@example.com',
      emailVerified: true,
    });

    expect(sendVerificationOTP).not.toHaveBeenCalled();
  });

  it('no-ops when auth has not been registered', async () => {
    await expect(
      handleExistingUserSignUp({
        email: 'user@example.com',
        emailVerified: false,
      }),
    ).resolves.toBeUndefined();
  });
});
