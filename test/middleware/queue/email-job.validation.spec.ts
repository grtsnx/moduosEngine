import { isValidSendEmailJobPayload } from 'src/middleware';

import { sendEmailJobPayload } from '../../fixtures';

describe('isValidSendEmailJobPayload', () => {
  it('accepts a valid payload', () => {
    expect(isValidSendEmailJobPayload(sendEmailJobPayload)).toBe(true);
  });

  it('rejects invalid recipients', () => {
    expect(
      isValidSendEmailJobPayload({
        ...sendEmailJobPayload,
        to: 'not-an-email',
      }),
    ).toBe(false);
  });

  it('rejects unsafe template names', () => {
    expect(
      isValidSendEmailJobPayload({
        ...sendEmailJobPayload,
        template: '../welcome',
      }),
    ).toBe(false);
  });

  it('rejects oversized context payloads', () => {
    expect(
      isValidSendEmailJobPayload({
        ...sendEmailJobPayload,
        context: {
          largeValue: 'a'.repeat(20_000),
        },
      }),
    ).toBe(false);
  });
});
