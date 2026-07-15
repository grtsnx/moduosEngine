import type { SendMailsService } from '../../email/sendMail.service';
import { organisationPath } from '../paths/auth-paths';

export interface AuthEmailHandlers {
  sendVerificationOTP: (params: {
    email: string;
    otp: string;
    type: 'email-verification' | 'sign-in' | 'forget-password';
  }) => Promise<void>;
  sendOrgInvitation: (params: {
    id: string;
    email: string;
    organization: { name: string };
    inviter: { user: { name?: string | null; email: string } };
    role: string;
  }) => Promise<void>;
  sendTwoFactorOTP: (params: {
    user: { email: string; name?: string | null; firstName?: string };
    otp: string;
  }) => Promise<void>;
  sendWelcome: (params: {
    user: { email: string; firstName?: string; name?: string | null };
  }) => Promise<void>;
}

let mailService: SendMailsService | null = null;

export function setAuthMailService(service: SendMailsService): void {
  mailService = service;
}

function resolveFirstName(user: {
  firstName?: string;
  name?: string | null;
  email: string;
}): string {
  if (typeof user.firstName === 'string' && user.firstName.trim().length > 0) {
    return user.firstName;
  }

  if (typeof user.name === 'string' && user.name.trim().length > 0) {
    return user.name;
  }

  return user.email;
}

export function toWelcomeEmailUser(user: {
  email: string;
  firstName?: string;
  name?: string | null;
}): { email: string; firstName?: string; name?: string | null } {
  return {
    email: user.email,
    firstName:
      'firstName' in user && typeof user.firstName === 'string'
        ? user.firstName
        : undefined,
    name: user.name,
  };
}

export function createAuthEmailHandlers(): AuthEmailHandlers {
  return {
    sendVerificationOTP: async ({ email, otp, type }) => {
      if (!mailService) {
        return;
      }

      await mailService.sendOtpEmail(email, type, otp, {
        expiresMinutes: 5,
      });
    },
    sendOrgInvitation: async ({ id, email, organization, inviter, role }) => {
      if (!mailService) {
        return;
      }

      const platformUrl = process.env.PLATFORM_URL?.trim() ?? '';
      const invitePath = organisationPath('/accept/invitation');
      const inviteUrl = platformUrl
        ? `${platformUrl.replace(/\/$/, '')}${invitePath}?invitationId=${encodeURIComponent(id)}`
        : `${invitePath}?invitationId=${encodeURIComponent(id)}`;

      await mailService.sendOrgInvitationEmail(email, {
        organizationName: organization.name,
        inviterName: inviter.user.name ?? inviter.user.email,
        role,
        inviteUrl,
      });
    },
    sendTwoFactorOTP: async ({ user, otp }) => {
      if (!mailService) {
        return;
      }

      await mailService.sendOtpEmail(user.email, 'two-factor', otp, {
        firstName: resolveFirstName(user),
        expiresMinutes: 5,
      });
    },
    sendWelcome: async ({ user }) => {
      if (!mailService) {
        return;
      }

      await mailService.sendWelcomeEmail(user.email, {
        firstName: resolveFirstName(user),
      });
    },
  };
}
