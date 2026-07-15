import type { PlatformContext } from '../common/platform-context';

export type EmailTemplateContext = PlatformContext & Record<string, unknown>;

export interface WelcomeEmailContext {
  firstName: string;
  ctaUrl?: string;
  [key: string]: unknown;
}

export type OtpEmailPurpose =
  'email-verification' | 'sign-in' | 'forget-password' | 'two-factor';

export interface OtpEmailContext {
  firstName?: string;
  expiresMinutes?: number;
  [key: string]: unknown;
}

export interface OrgInvitationEmailContext {
  organizationName: string;
  inviterName: string;
  role?: string;
  inviteUrl: string;
  [key: string]: unknown;
}

export interface SendEmailJobPayload {
  to: string | string[];
  subject: string;
  template: string;
  context?: Record<string, unknown>;
}
