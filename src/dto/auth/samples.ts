export const SAMPLE_USER = {
  id: 'usr_01HXYZ000000000000000000',
  email: 'alex@example.com',
  name: 'Alex Example',
  firstName: 'Alex',
  lastName: 'Example',
  emailVerified: true,
  image: null,
  referralCode: 'ref_a1b2c3d4e5f60718',
  createdAt: '2026-07-05T00:00:00.000Z',
  updatedAt: '2026-07-05T00:00:00.000Z',
} as const;

export const SAMPLE_SESSION = {
  id: 'ses_01HXYZ000000000000000000',
  userId: SAMPLE_USER.id,
  expiresAt: '2026-07-12T00:00:00.000Z',
  token: 'session-token-example',
  createdAt: '2026-07-05T00:00:00.000Z',
  updatedAt: '2026-07-05T00:00:00.000Z',
} as const;

export const SAMPLE_ORGANIZATION = {
  id: 'org_01HXYZ000000000000000000',
  name: 'Acme Billing',
  slug: 'acme-billing',
  createdAt: '2026-07-05T00:00:00.000Z',
} as const;

export const SAMPLE_BEARER_TOKEN = 'bearer-token-example';

export const SAMPLE_TWO_FACTOR_SECRET = 'JBSWY3DPEHPK3PXP';

export const SAMPLE_PASSKEY_CREDENTIAL = {
  id: 'passkey-credential-id',
  publicKey: 'public-key-example',
  counter: 0,
  deviceType: 'platform',
  backedUp: true,
  transports: ['internal'],
} as const;
