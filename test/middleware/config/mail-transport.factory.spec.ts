import { ConfigService } from '@nestjs/config';

import { mailTransportConfigFixtures } from '../../fixtures';
import { createMailTransport, createMailerModuleOptions } from 'src/middleware';

function createConfigService(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('mail-transport.factory', () => {
  it('creates jsonTransport for test provider', () => {
    const transport = createMailTransport(
      createConfigService(mailTransportConfigFixtures.test),
    );

    expect(transport).toEqual({ jsonTransport: true });
  });

  it('creates google transport when configured', () => {
    const transport = createMailTransport(
      createConfigService(mailTransportConfigFixtures.google),
    );

    expect(transport).toEqual(
      expect.objectContaining({
        service: 'gmail',
        auth: {
          user: 'user@gmail.com',
          pass: 'secret',
        },
        disableFileAccess: true,
        disableUrlAccess: true,
      }),
    );
  });

  it('throws for invalid email provider', () => {
    expect(() =>
      createMailTransport(
        createConfigService(mailTransportConfigFixtures.invalidProvider),
      ),
    ).toThrow('EMAIL_PROVIDER must be one of');
  });

  it('creates smtp transport when configured', () => {
    const transport = createMailTransport(
      createConfigService(mailTransportConfigFixtures.smtp),
    );

    expect(transport).toEqual(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        requireTLS: true,
        disableFileAccess: true,
        disableUrlAccess: true,
      }),
    );
  });

  it('enables secure SMTP mode for port 465', () => {
    const transport = createMailTransport(
      createConfigService({
        EMAIL_PROVIDER: 'smtp',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
      }),
    );

    expect(transport).toEqual(
      expect.objectContaining({
        secure: true,
        port: 465,
      }),
    );
  });

  it('builds mailer module options with from address', () => {
    const options = createMailerModuleOptions(
      createConfigService(mailTransportConfigFixtures.mailerOptions),
    );

    expect(options.defaults.from).toBe('TestPlatform <noreply@test.local>');
    expect(options.transport).toEqual({ jsonTransport: true });
  });

  it('throws when PLATFORM_SUPPORT is missing in mailer options', () => {
    expect(() =>
      createMailerModuleOptions(
        createConfigService(
          mailTransportConfigFixtures.mailerOptionsMissingSupport,
        ),
      ),
    ).toThrow('PLATFORM_SUPPORT environment variable is required');
  });
});
