import { wrapRedisError } from 'src/middleware';

describe('wrapRedisError', () => {
  it('wraps Error instances with operation context', () => {
    expect(() => wrapRedisError('getting data', new Error('timeout'))).toThrow(
      'Error getting data in Redis: timeout',
    );
  });

  it('wraps non-Error values', () => {
    expect(() => wrapRedisError('saving data', 'broken')).toThrow(
      'Error saving data in Redis: broken',
    );
  });

  it('preserves original error as cause', () => {
    const original = new Error('timeout');

    try {
      wrapRedisError('getting data', original);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).cause).toBe(original);
    }
  });
});
