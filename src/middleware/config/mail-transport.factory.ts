import { ConfigService } from '@nestjs/config';

import { buildMailFromField } from '../common/platform-context';
import type { MailTransportOptions } from './mail-transport.types';

type EmailProvider = 'google' | 'smtp' | 'test';

function getEmailProvider(configService: ConfigService): EmailProvider {
  const provider = configService.get<string>('EMAIL_PROVIDER') ?? 'test';
  if (provider === 'google' || provider === 'smtp' || provider === 'test') {
    return provider;
  }
  throw new Error(
    `EMAIL_PROVIDER must be one of: google, smtp, test (received "${provider}")`,
  );
}

export function createMailTransport(
  configService: ConfigService,
): MailTransportOptions {
  const provider = getEmailProvider(configService);
  const disableUnsafeSourceAccess = {
    disableFileAccess: true,
    disableUrlAccess: true,
  };

  if (provider === 'google') {
    return {
      service: 'gmail',
      auth: {
        user: configService.get<string>('EMAIL_ADDRESS'),
        pass: configService.get<string>('EMAIL_PASSWORD'),
      },
      ...disableUnsafeSourceAccess,
    };
  }

  if (provider === 'smtp') {
    const port = Number(configService.get<number>('SMTP_PORT') ?? 587);
    const isTlsPort = port === 465;

    return {
      host: configService.get<string>('SMTP_HOST'),
      port,
      secure: isTlsPort,
      requireTLS: true,
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
      ...disableUnsafeSourceAccess,
    };
  }

  return { jsonTransport: true };
}

export function createMailerModuleOptions(configService: ConfigService) {
  return {
    transport: createMailTransport(configService),
    defaults: {
      from: buildMailFromField(configService),
    },
  };
}
