import { AUTH_BASE_PATH } from 'src/lib/betterauth/paths/auth-paths';
import { normalizeAuthRelativePath } from 'src/lib/betterauth/paths/normalize-auth-path';

describe('normalizeAuthRelativePath', () => {
  it('strips the auth base path prefix', () => {
    expect(normalizeAuthRelativePath(`${AUTH_BASE_PATH}/sign-up/email`)).toBe(
      '/sign-up/email',
    );
  });

  it('maps the bare auth base path to root', () => {
    expect(normalizeAuthRelativePath(AUTH_BASE_PATH)).toBe('/');
  });

  it('normalizes relative paths without a leading slash', () => {
    expect(normalizeAuthRelativePath('sign-up/email')).toBe('/sign-up/email');
  });

  it('passes through already-relative auth paths unchanged', () => {
    expect(normalizeAuthRelativePath('/sign-in/social')).toBe(
      '/sign-in/social',
    );
  });
});
