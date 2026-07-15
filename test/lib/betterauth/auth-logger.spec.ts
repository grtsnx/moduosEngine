import {
  buildBetterAuthLogger,
  resetBetterAuthLoggerStateForTests,
} from 'src/lib/betterauth/core/auth-logger';

describe('buildBetterAuthLogger', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetBetterAuthLoggerStateForTests();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('suppresses non-error log levels', () => {
    const logger = buildBetterAuthLogger();

    logger.log('warn', '[Dash] Email validation unavailable', {
      error: 'Not found',
    });
    logger.log('info', 'Auth initialized');

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('logs a single-line prisma validation summary', () => {
    const logger = buildBetterAuthLogger();
    const prismaError = new Error(
      'Invalid `prisma.user.create()` invocation:\n\nUnknown argument `firstName`.',
    );

    logger.log('error', 'Failed to create user', prismaError);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Better Auth] Failed to create user: Unknown argument `firstName`.',
    );
  });

  it('deduplicates identical errors logged in quick succession', () => {
    const logger = buildBetterAuthLogger();
    const prismaError = new Error('Unknown argument `firstName`.');

    logger.log('error', 'Failed to create user', prismaError);
    logger.log('error', 'Failed to create user', prismaError);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
