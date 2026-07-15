import {
  applySignupProfileImage,
  resolveProfileImageFromEmail,
} from 'src/lib/betterauth/hooks/auth-gravatar';
import { gravatarEmailFixtures } from 'test/fixtures';

describe('auth-gravatar', () => {
  it('builds an https gravatar URL from email', () => {
    const url = resolveProfileImageFromEmail(gravatarEmailFixtures.standard);

    expect(url.startsWith('https://')).toBe(true);
    expect(url).toContain('gravatar.com/avatar/');
  });

  it('normalizes email casing before hashing', () => {
    const lower = resolveProfileImageFromEmail('Alex@Example.com');
    const upper = resolveProfileImageFromEmail('alex@example.com');

    expect(lower).toBe(upper);
  });

  it('sets image on signup when missing', () => {
    const user = applySignupProfileImage({
      email: gravatarEmailFixtures.standard,
      image: null,
    });

    expect(user.image).toContain('gravatar.com/avatar/');
  });

  it('preserves an existing image from social providers', () => {
    const user = applySignupProfileImage({
      email: gravatarEmailFixtures.standard,
      image: 'https://cdn.example.com/avatar.png',
    });

    expect(user.image).toBe('https://cdn.example.com/avatar.png');
  });
});
