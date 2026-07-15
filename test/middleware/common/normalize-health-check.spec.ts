import { normalizeReadinessPayload } from 'src/middleware/common/normalize-health-check';

describe('normalizeReadinessPayload', () => {
  it('returns status and checks from terminus details only', () => {
    expect(
      normalizeReadinessPayload({
        status: 'ok',
        info: {
          redis: { status: 'up' },
          queue: { status: 'up' },
        },
        error: {},
        details: {
          redis: { status: 'up' },
          queue: { status: 'up' },
        },
      }),
    ).toEqual({
      status: 'ok',
      checks: {
        redis: { status: 'up' },
        queue: { status: 'up' },
      },
    });
  });

  it('wraps flat indicator failures as error checks', () => {
    expect(
      normalizeReadinessPayload({
        redis: { status: 'down', message: 'PING failed' },
      }),
    ).toEqual({
      status: 'error',
      checks: {
        redis: { status: 'down', message: 'PING failed' },
      },
    });
  });
});
