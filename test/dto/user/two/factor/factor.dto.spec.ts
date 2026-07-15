import { validate } from 'class-validator';

import {
  DisableTwoFactorRequestDto,
  EnableTwoFactorRequestDto,
  VerifyTwoFactorRequestDto,
} from 'src/dto';

describe('user two factor DTOs', () => {
  it('accepts valid enable payload', async () => {
    const dto = Object.assign(new EnableTwoFactorRequestDto(), {
      password: 'SecurePass123!',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects invalid TOTP code length on verify', async () => {
    const dto = Object.assign(new VerifyTwoFactorRequestDto(), {
      code: '12345',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('accepts valid disable payload', async () => {
    const dto = Object.assign(new DisableTwoFactorRequestDto(), {
      code: '123456',
    });

    expect(await validate(dto)).toHaveLength(0);
  });
});
