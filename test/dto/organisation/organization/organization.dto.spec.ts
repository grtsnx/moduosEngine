import { validate } from 'class-validator';

import { CreateOrganizationRequestDto, InviteMemberRequestDto } from 'src/dto';

describe('organisation DTOs', () => {
  it('accepts valid create organization payload', async () => {
    const dto = Object.assign(new CreateOrganizationRequestDto(), {
      name: 'Acme Billing',
      slug: 'acme-billing',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects empty organization slug', async () => {
    const dto = Object.assign(new CreateOrganizationRequestDto(), {
      name: 'Acme Billing',
      slug: '',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('accepts valid invite member payload', async () => {
    const dto = Object.assign(new InviteMemberRequestDto(), {
      email: 'member@example.com',
      role: 'member',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects invalid invite email', async () => {
    const dto = Object.assign(new InviteMemberRequestDto(), {
      email: 'not-an-email',
      role: 'member',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
