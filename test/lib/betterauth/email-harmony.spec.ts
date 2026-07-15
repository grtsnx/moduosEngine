import { emailHarmony } from 'better-auth-harmony';
import isEmail from 'validator/lib/isEmail.js';
import normalizeEmail from 'validator/lib/normalizeEmail.js';
import Mailchecker from 'mailchecker';

function validateEmailLikeHarmony(email: string): boolean {
  return isEmail(email) && Mailchecker.isValid(email);
}

describe('emailHarmony', () => {
  it('registers harmony-email plugin with strict normalized sign-in', () => {
    const plugin = emailHarmony({ allowNormalizedSignin: false });

    expect(plugin.id).toBe('harmony-email');
    expect(plugin.schema?.user?.fields?.normalizedEmail).toMatchObject({
      type: 'string',
      unique: true,
      required: false,
    });
  });

  it('rejects disposable email domains', () => {
    expect(validateEmailLikeHarmony('throwaway@mailinator.com')).toBe(false);
    expect(validateEmailLikeHarmony('user@example.com')).toBe(true);
  });

  it('normalizes gmail plus-address aliases to the same base email', () => {
    const withAlias = normalizeEmail('foo+tag@gmail.com', {
      gmail_remove_subaddress: true,
    });
    const withoutAlias = normalizeEmail('foo@gmail.com', {
      gmail_remove_subaddress: true,
    });

    expect(withAlias).toBe(withoutAlias);
    expect(withAlias).toBe('foo@gmail.com');
  });
});
