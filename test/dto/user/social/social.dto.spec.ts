import { validate } from 'class-validator';

import { SignInSocialRequestDto } from 'src/dto';

describe('user social DTOs', () => {
  it('accepts valid social sign-in payload', async () => {
    const dto = Object.assign(new SignInSocialRequestDto(), {
      provider: 'google',
      callbackURL: 'https://app.example.com/dashboard',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects missing callback URL', async () => {
    const dto = Object.assign(new SignInSocialRequestDto(), {
      provider: 'google',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
