import { validate } from 'class-validator';

import { ResetPasswordRequestDto } from 'src/dto';

describe('ResetPasswordRequestDto', () => {
  it('accepts a strong new password', async () => {
    const dto = Object.assign(new ResetPasswordRequestDto(), {
      token: 'reset-token',
      newPassword: 'SecurePass123!',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects weak new password', async () => {
    const dto = Object.assign(new ResetPasswordRequestDto(), {
      token: 'reset-token',
      newPassword: 'short',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects new password without complexity', async () => {
    const dto = Object.assign(new ResetPasswordRequestDto(), {
      token: 'reset-token',
      newPassword: 'abcdefghijkl',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
