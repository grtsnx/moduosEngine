import { validate } from 'class-validator';

import { BanUserRequestDto } from 'src/dto';

describe('backoffice admin DTOs', () => {
  it('accepts valid ban user payload', async () => {
    const dto = Object.assign(new BanUserRequestDto(), {
      userId: 'usr_01HXYZ000000000000000000',
      banReason: 'Terms of service violation',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects missing user id', async () => {
    const dto = Object.assign(new BanUserRequestDto(), {
      banReason: 'Terms of service violation',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
