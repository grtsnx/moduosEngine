import {
  createAuthEmailHandlers,
  setAuthMailService,
} from 'src/lib/betterauth/core/auth-email';

describe('auth-email', () => {
  afterEach(() => {
    setAuthMailService(null as never);
  });

  it('delegates verification OTP to SendMailsService', async () => {
    const sendOtpEmail = jest.fn().mockResolvedValue(true);
    setAuthMailService({
      sendOtpEmail,
    } as never);

    const handlers = createAuthEmailHandlers();
    await handlers.sendVerificationOTP({
      email: 'alex@example.com',
      otp: '123456',
      type: 'email-verification',
    });

    expect(sendOtpEmail).toHaveBeenCalledWith(
      'alex@example.com',
      'email-verification',
      '123456',
      { expiresMinutes: 5 },
    );
  });

  it('delegates organization invitation email to SendMailsService', async () => {
    const sendOrgInvitationEmail = jest
      .fn<
        Promise<boolean>,
        [string, { inviteUrl: string; organizationName: string }]
      >()
      .mockResolvedValue(true);
    process.env.PLATFORM_URL = 'https://app.example.com';
    setAuthMailService({
      sendOrgInvitationEmail,
    } as never);

    const handlers = createAuthEmailHandlers();
    await handlers.sendOrgInvitation({
      id: 'inv_123',
      email: 'member@example.com',
      organization: { name: 'Acme Billing' },
      inviter: { user: { name: 'Alex', email: 'alex@example.com' } },
      role: 'member',
    });

    expect(sendOrgInvitationEmail).toHaveBeenCalledWith(
      'member@example.com',
      expect.objectContaining({
        organizationName: 'Acme Billing',
        inviterName: 'Alex',
        role: 'member',
      }),
    );
    const [, invitationContext] = sendOrgInvitationEmail.mock.calls[0] ?? [];
    expect(invitationContext?.inviteUrl).toContain('invitationId=inv_123');
  });

  it('delegates two factor OTP to SendMailsService', async () => {
    const sendOtpEmail = jest.fn().mockResolvedValue(true);
    setAuthMailService({
      sendOtpEmail,
    } as never);

    const handlers = createAuthEmailHandlers();
    await handlers.sendTwoFactorOTP({
      user: { email: 'alex@example.com', firstName: 'Alex' },
      otp: '654321',
    });

    expect(sendOtpEmail).toHaveBeenCalledWith(
      'alex@example.com',
      'two-factor',
      '654321',
      { firstName: 'Alex', expiresMinutes: 5 },
    );
  });

  it('delegates welcome email to SendMailsService', async () => {
    const sendWelcomeEmail = jest.fn().mockResolvedValue(true);
    setAuthMailService({
      sendWelcomeEmail,
    } as never);

    const handlers = createAuthEmailHandlers();
    await handlers.sendWelcome({
      user: { email: 'alex@example.com', firstName: 'Alex' },
    });

    expect(sendWelcomeEmail).toHaveBeenCalledWith('alex@example.com', {
      firstName: 'Alex',
    });
  });

  it('no-ops when mail service is unset', async () => {
    setAuthMailService(null as never);
    const handlers = createAuthEmailHandlers();

    await expect(
      handlers.sendVerificationOTP({
        email: 'alex@example.com',
        otp: '123456',
        type: 'sign-in',
      }),
    ).resolves.toBeUndefined();
  });
});
