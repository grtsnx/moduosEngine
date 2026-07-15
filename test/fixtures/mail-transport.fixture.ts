/** EMAIL_PROVIDER config snapshots for mail-transport.factory specs. */
export const mailTransportConfigFixtures = {
  test: { EMAIL_PROVIDER: 'test' },
  google: {
    EMAIL_PROVIDER: 'google',
    EMAIL_ADDRESS: 'user@gmail.com',
    EMAIL_PASSWORD: 'secret',
  },
  smtp: {
    EMAIL_PROVIDER: 'smtp',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_USER: 'user',
    SMTP_PASS: 'pass',
  },
  invalidProvider: { EMAIL_PROVIDER: 'mailgun' },
  mailerOptions: {
    EMAIL_PROVIDER: 'test',
    PLATFORM_NAME: 'TestPlatform',
    PLATFORM_SUPPORT: 'noreply@test.local',
  },
  mailerOptionsMissingSupport: {
    EMAIL_PROVIDER: 'test',
    PLATFORM_NAME: 'TestPlatform',
  },
} as const;
