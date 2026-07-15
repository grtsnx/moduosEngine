import { InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import {
  multiEmailRecipients,
  platformEmailContext,
  sendEmailJobPayload,
  welcomeEmailContext,
  welcomeEmailContextNoCta,
  welcomeEmailRecipient,
  welcomeEmailSubject,
} from '../../fixtures';
import { SendMailsService } from 'src/lib';
import { QueueService } from 'src/middleware';

describe('SendMailsService', () => {
  let service: SendMailsService;
  let mailerService: {
    sendMail: jest.MockedFunction<MailerService['sendMail']>;
    verifyAllTransporters: jest.MockedFunction<
      MailerService['verifyAllTransporters']
    >;
  };
  let queueService: { enqueueEmailSend: jest.Mock };
  let configGetMock: jest.Mock;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    mailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<
        MailerService['sendMail']
      >,
      verifyAllTransporters: jest.fn().mockResolvedValue(true),
    };
    queueService = { enqueueEmailSend: jest.fn().mockResolvedValue(true) };
    configGetMock = jest.fn((key: string) => {
      const values: Record<string, string> = {
        PLATFORM_NAME: platformEmailContext.platformName,
        PLATFORM_SUPPORT: platformEmailContext.platformSupport,
        PLATFORM_URL: platformEmailContext.platformUrl,
        PLATFORM_LOGO_URL: '',
        COLOR_CODE: platformEmailContext.brandColor,
      };
      return values[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendMailsService,
        {
          provide: MailerService,
          useValue: mailerService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: configGetMock,
          },
        },
        {
          provide: QueueService,
          useValue: queueService,
        },
      ],
    }).compile();

    service = module.get(SendMailsService);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    loggerLogSpy.mockRestore();
  });

  it('logs email connected on module init when transport verifies', async () => {
    await service.onModuleInit();

    expect(mailerService.verifyAllTransporters).toHaveBeenCalled();
    expect(loggerLogSpy).toHaveBeenCalledWith('✓ Email connected');
  });

  it('sendEmail merges platform context and sends mail', async () => {
    await expect(
      service.sendEmail(
        welcomeEmailRecipient,
        welcomeEmailSubject,
        'welcome',
        welcomeEmailContext,
      ),
    ).resolves.toBe(true);

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    const mailPayload = mailerService.sendMail.mock.calls[0]?.[0];

    expect(mailPayload?.to).toBe(welcomeEmailRecipient);
    expect(mailPayload?.subject).toBe(welcomeEmailSubject);
    expect(mailPayload?.template).toBe('welcome');
    expect(mailPayload?.context?.firstName).toBe(welcomeEmailContext.firstName);
    expect(mailPayload?.context?.ctaUrl).toBe(welcomeEmailContext.ctaUrl);
    expect(mailPayload?.context?.platformName).toBe(
      platformEmailContext.platformName,
    );
    expect(mailPayload?.context?.brandColor).toBe(
      platformEmailContext.brandColor,
    );
  });

  it('sendWelcomeEmail uses welcome template and default subject', async () => {
    await service.sendWelcomeEmail(welcomeEmailRecipient, welcomeEmailContext);

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    const mailPayload = mailerService.sendMail.mock.calls[0]?.[0];

    expect(mailPayload?.template).toBe('welcome');
    expect(mailPayload?.subject).toBe(
      `Welcome to ${platformEmailContext.platformName}`,
    );
    expect(mailPayload?.context?.firstName).toBe(welcomeEmailContext.firstName);
    expect(mailPayload?.context?.ctaUrl).toBe(welcomeEmailContext.ctaUrl);
  });

  it('sendEmail throws InternalServerErrorException on timeout', async () => {
    mailerService.sendMail.mockRejectedValue({ code: 'ETIMEDOUT' });

    await expect(
      service.sendEmail(welcomeEmailRecipient, welcomeEmailSubject, 'welcome'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('sendEmail throws InternalServerErrorException on generic failure', async () => {
    mailerService.sendMail.mockRejectedValue(new Error('SMTP failure'));

    await expect(
      service.sendEmail(welcomeEmailRecipient, welcomeEmailSubject, 'welcome'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('masks recipient addresses in failure logs', async () => {
    mailerService.sendMail.mockRejectedValue(new Error('SMTP failure'));

    await expect(
      service.sendEmail(
        'alice@example.com\nX-Injected: value',
        welcomeEmailSubject,
        'welcome',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    const loggerCalls = loggerErrorSpy.mock.calls as [unknown, unknown?][];
    const firstMessage = loggerCalls[0]?.[0];
    const message = typeof firstMessage === 'string' ? firstMessage : '';
    expect(message).toContain('al***@example.com');
    expect(message).not.toContain('\n');
    expect(message).not.toContain('alice@example.com');
  });

  it('sendEmailAsync enqueues job with fixture payload', async () => {
    await expect(
      service.sendEmailAsync(
        sendEmailJobPayload.to,
        sendEmailJobPayload.subject,
        sendEmailJobPayload.template,
        sendEmailJobPayload.context,
      ),
    ).resolves.toBe(true);

    expect(queueService.enqueueEmailSend).toHaveBeenCalledWith(
      sendEmailJobPayload,
    );
  });

  it('sendEmailAsync returns false when enqueue fails', async () => {
    queueService.enqueueEmailSend.mockRejectedValue(new Error('queue down'));

    await expect(
      service.sendEmailAsync(
        welcomeEmailRecipient,
        welcomeEmailSubject,
        'welcome',
      ),
    ).resolves.toBe(false);
  });

  it('sendEmailAsync returns false when enqueue resolves false', async () => {
    queueService.enqueueEmailSend.mockResolvedValue(false);

    await expect(
      service.sendEmailAsync(
        welcomeEmailRecipient,
        welcomeEmailSubject,
        'welcome',
      ),
    ).resolves.toBe(false);
  });

  it('sendEmail supports multiple recipients', async () => {
    await service.sendEmail(
      [...multiEmailRecipients],
      welcomeEmailSubject,
      'welcome',
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: [...multiEmailRecipients] }),
    );
  });

  it('sendWelcomeEmail falls back to PLATFORM_URL when ctaUrl is omitted', async () => {
    await service.sendWelcomeEmail(
      welcomeEmailRecipient,
      welcomeEmailContextNoCta,
    );

    const mailPayload = mailerService.sendMail.mock.calls[0]?.[0];
    expect(mailPayload?.context?.ctaUrl).toBe(platformEmailContext.platformUrl);
  });

  it('sendWelcomeEmail omits ctaUrl when PLATFORM_URL is unset', async () => {
    configGetMock.mockImplementation((key: string) => {
      const values: Record<string, string | null> = {
        PLATFORM_NAME: platformEmailContext.platformName,
        PLATFORM_SUPPORT: platformEmailContext.platformSupport,
        PLATFORM_URL: '',
        PLATFORM_LOGO_URL: '',
        COLOR_CODE: platformEmailContext.brandColor,
      };
      return values[key] ?? undefined;
    });

    await service.sendWelcomeEmail(
      welcomeEmailRecipient,
      welcomeEmailContextNoCta,
    );

    const mailPayload = mailerService.sendMail.mock.calls[0]?.[0];
    expect(mailPayload?.context?.ctaUrl).toBeUndefined();
  });

  it('sendOtpEmail uses auth-otp template for verification', async () => {
    await service.sendOtpEmail(
      'alex@example.com',
      'email-verification',
      '123456',
      { firstName: 'Alex' },
    );

    const mailPayload = mailerService.sendMail.mock.calls[0]?.[0];
    expect(mailPayload?.template).toBe('auth-otp');
    expect(mailPayload?.context?.otp).toBe('123456');
    expect(mailPayload?.context?.firstName).toBe('Alex');
  });

  it('sendOrgInvitationEmail uses auth-org-invite template', async () => {
    await service.sendOrgInvitationEmail('member@example.com', {
      organizationName: 'Acme Billing',
      inviterName: 'Alex',
      role: 'member',
      inviteUrl: 'https://app.example.com/invite',
    });

    const mailPayload = mailerService.sendMail.mock.calls[0]?.[0];
    expect(mailPayload?.template).toBe('auth-org-invite');
    expect(mailPayload?.context?.inviteUrl).toBe(
      'https://app.example.com/invite',
    );
  });
});
