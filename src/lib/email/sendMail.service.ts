import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

import { buildPlatformContext } from 'src/middleware/common/platform-context';
import { QueueService } from 'src/middleware/queue/queue.service';
import type {
  EmailTemplateContext,
  OtpEmailContext,
  OtpEmailPurpose,
  OrgInvitationEmailContext,
  SendEmailJobPayload,
  WelcomeEmailContext,
} from 'src/middleware/types/email.types';

@Injectable()
export class SendMailsService implements OnModuleInit {
  private readonly logger = new Logger(SendMailsService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const verified = await this.mailerService.verifyAllTransporters();
      if (verified) {
        this.logger.log('✓ Email connected');
        return;
      }

      this.logger.error('Email transport verification failed');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown verification error';
      this.logger.error(`Email connection failed: ${message}`);
    }
  }

  private getEmailContext(
    baseContext: Record<string, unknown> = {},
  ): EmailTemplateContext {
    return buildPlatformContext(this.configService, baseContext);
  }

  private sanitizeForLog(value: string): string {
    return value.replace(/[\r\n\t]/g, ' ').trim();
  }

  private maskEmail(email: string): string {
    const sanitized = this.sanitizeForLog(email.trim().toLowerCase());
    const atIndex = sanitized.indexOf('@');
    if (atIndex <= 1 || atIndex === sanitized.length - 1) {
      return '[redacted-email]';
    }

    const local = sanitized.slice(0, atIndex);
    const domain = sanitized.slice(atIndex + 1);
    const visibleLocal = local.slice(0, 2);
    return `${visibleLocal}***@${domain}`;
  }

  private maskRecipients(to: string | string[]): string {
    if (Array.isArray(to)) {
      return to.map((recipient) => this.maskEmail(recipient)).join(', ');
    }
    return this.maskEmail(to);
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    template: string,
    context?: Record<string, unknown>,
  ): Promise<boolean> {
    const mergedContext = this.getEmailContext(context ?? {});

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: mergedContext,
      });

      return true;
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string; code?: string };
      const maskedRecipients = this.maskRecipients(to);
      this.logger.error(
        `Failed to send email to ${maskedRecipients}: ${this.sanitizeForLog(err.message ?? 'unknown error')}`,
        err.stack,
      );

      if (err.code === 'ETIMEDOUT') {
        throw new InternalServerErrorException(
          'Connection timeout while sending email. Please try again later.',
        );
      }

      throw new InternalServerErrorException('Failed to send email.');
    }
  }

  async sendWelcomeEmail(
    to: string,
    context: WelcomeEmailContext,
  ): Promise<boolean> {
    const platformName =
      this.configService.get<string>('PLATFORM_NAME')?.trim() ?? '';
    const platformUrl =
      this.configService
        .get<string>('PLATFORM_URL')
        ?.trim()
        .replace(/\/$/, '') ?? '';
    const subject = platformName ? `Welcome to ${platformName}` : 'Welcome';
    const ctaUrl = context.ctaUrl?.trim() || platformUrl || undefined;

    return this.sendEmail(to, subject, 'welcome', {
      ...context,
      ...(ctaUrl ? { ctaUrl } : {}),
    });
  }

  private resolveOtpEmailCopy(purpose: OtpEmailPurpose): {
    subject: string;
    headline: string;
    bodyText: string;
  } {
    const platformName =
      this.configService.get<string>('PLATFORM_NAME')?.trim() ?? '';

    switch (purpose) {
      case 'email-verification':
        return {
          subject: platformName
            ? `Verify your ${platformName} email`
            : 'Verify your email',
          headline: 'Verify your email',
          bodyText: platformName
            ? `Use the code below to verify your email address for ${platformName}.`
            : 'Use the code below to verify your email address.',
        };
      case 'sign-in':
        return {
          subject: platformName
            ? `Sign in to ${platformName}`
            : 'Your sign-in code',
          headline: 'Sign in to your account',
          bodyText: platformName
            ? `Use the code below to sign in to ${platformName}.`
            : 'Use the code below to sign in to your account.',
        };
      case 'forget-password':
        return {
          subject: platformName
            ? `Reset your ${platformName} password`
            : 'Reset your password',
          headline: 'Reset your password',
          bodyText: platformName
            ? `Use the code below to reset your ${platformName} password.`
            : 'Use the code below to reset your password.',
        };
      case 'two-factor':
        return {
          subject: platformName
            ? `Your ${platformName} security code`
            : 'Your security code',
          headline: 'Your security code',
          bodyText: platformName
            ? `Use the code below to complete sign-in to ${platformName}.`
            : 'Use the code below to complete sign-in.',
        };
      default: {
        const exhaustive: never = purpose;
        return exhaustive;
      }
    }
  }

  async sendOtpEmail(
    to: string,
    purpose: OtpEmailPurpose,
    otp: string,
    context: OtpEmailContext = {},
  ): Promise<boolean> {
    const copy = this.resolveOtpEmailCopy(purpose);

    return this.sendEmail(to, copy.subject, 'auth-otp', {
      ...context,
      otp,
      purpose,
      headline: copy.headline,
      bodyText: copy.bodyText,
      emailTitle: copy.subject,
      expiresMinutes: context.expiresMinutes ?? 5,
    });
  }

  async sendOrgInvitationEmail(
    to: string,
    context: OrgInvitationEmailContext,
  ): Promise<boolean> {
    const platformName =
      this.configService.get<string>('PLATFORM_NAME')?.trim() ?? '';
    const subject = platformName
      ? `Join ${context.organizationName} on ${platformName}`
      : `Join ${context.organizationName}`;

    return this.sendEmail(to, subject, 'auth-org-invite', context);
  }

  async sendEmailAsync(
    to: string | string[],
    subject: string,
    template: string,
    context?: Record<string, unknown>,
  ): Promise<boolean> {
    const maskedRecipients = this.maskRecipients(to);
    const sanitizedTemplate = this.sanitizeForLog(template);
    this.logger.log(
      `Attempting to enqueue email.send to: ${maskedRecipients} with template: ${sanitizedTemplate}`,
    );

    const payload: SendEmailJobPayload = { to, subject, template, context };

    try {
      const enqueued = await this.queueService.enqueueEmailSend(payload);
      if (enqueued) {
        this.logger.log(
          `Successfully enqueued email.send for: ${maskedRecipients}`,
        );
      }
      return enqueued;
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Failed to enqueue email.send for: ${maskedRecipients}`,
        errorStack,
      );
      return false;
    }
  }
}
